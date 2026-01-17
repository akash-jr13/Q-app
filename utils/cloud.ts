
/**
 * Cloud Service Layer
 * Securely connects to Supabase Auth and Database
 */

export interface UserProfile {
    id: string;
    email: string;
    fullName: string;
    targetExam: string;
    joinedAt?: string;
}

export interface GlobalTestStats {
    rank: number;
    percentile: number;
    totalAttempts: number;
    avgScore: number;
    topScore: number;
}

// Safe environment variable accessor
const getEnv = (key: string): string => {
    try {
        // Vite uses import.meta.env
        return (import.meta.env[key] || "").toString();
    } catch (e) {
        return "";
    }
};

const URL_RAW = getEnv('VITE_SUPABASE_URL');
const SUPABASE_URL = URL_RAW ? URL_RAW.replace(/\/$/, "") : "";
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

/**
 * Enhanced fetch with strict timeout
 */
async function fetchWithTimeout(resource: string, options: any = {}, timeout = 6000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error: any) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error("Connection Timeout: Server is not responding.");
        }
        throw new Error(error.message || "Network error.");
    }
}

export const CloudService = {
    isConfigured(): boolean {
        return (
            !!SUPABASE_URL &&
            !!SUPABASE_ANON_KEY &&
            !SUPABASE_URL.includes("your-project-id") &&
            SUPABASE_URL.startsWith("http")
        );
    },

    getHeaders(token?: string) {
        const headers: any = {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    },

    /**
     * AUTH: Sign Up
     */
    async signUp(email: string, pass: string, fullName: string, targetExam: string): Promise<{ user?: any, error?: string }> {
        if (!this.isConfigured()) return { error: "Cloud Uplink is not configured." };

        try {
            const res = await fetchWithTimeout(`${SUPABASE_URL}/auth/v1/signup`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    email,
                    password: pass,
                    data: { full_name: fullName, target_exam: targetExam }
                })
            });
            const data = await res.json();
            if (!res.ok) {
                return { error: data.msg || data.error_description || "Identity creation failed." };
            }
            return { user: data.user };
        } catch (e: any) {
            return { error: e.message };
        }
    },

    /**
     * AUTH: Login
     */
    async login(email: string, pass: string): Promise<{ session?: any, error?: string }> {
        if (!this.isConfigured()) return { error: "Cloud Uplink is not configured." };

        try {
            const res = await fetchWithTimeout(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ email, password: pass })
            });
            const data = await res.json();
            if (!res.ok) return { error: data.error_description || "Invalid credentials." };
            return { session: data };
        } catch (e: any) {
            return { error: e.message };
        }
    },

    /**
     * Get User Profile from Token
     */
    async getProfile(token: string): Promise<UserProfile | null> {
        if (!this.isConfigured() || !token) return null;

        try {
            const res = await fetchWithTimeout(`${SUPABASE_URL}/auth/v1/user`, {
                headers: this.getHeaders(token)
            }, 4000);
            const data = await res.json();
            if (!res.ok) return null;
            return {
                id: data.id,
                email: data.email,
                fullName: data.user_metadata?.full_name || "Agent",
                targetExam: data.user_metadata?.target_exam || "General"
            };
        } catch (e) {
            return null;
        }
    },

    /**
     * DATABASE: Submit Attempt
     */
    async submitAttempt(testName: string, score: number, accuracy: number, userId?: string): Promise<boolean> {
        if (!this.isConfigured()) return false;
        try {
            const response = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/test_attempts`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    test_name: testName,
                    score: score,
                    accuracy: accuracy,
                    user_id: userId,
                    timestamp: new Date().toISOString()
                })
            });
            return response.ok;
        } catch (e) {
            return false;
        }
    },

    /**
     * RPC: Global Stats
     */
    async getGlobalStats(testName: string, userScore: number): Promise<GlobalTestStats | null> {
        if (!this.isConfigured()) return null;
        try {
            const response = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/rpc/get_global_test_stats`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ target_test_name: testName, user_score: userScore })
            });
            if (!response.ok) return null;
            return await response.json();
        } catch (e) {
            return null;
        }
    },

    /**
     * DATABASE: Get Attempts for User
     */
    async getAttempts(userId: string): Promise<any[]> {
        if (!this.isConfigured() || !userId) return [];
        try {
            const response = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/test_attempts?user_id=eq.${userId}&order=timestamp.desc`, {
                headers: this.getHeaders()
            });
            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            return [];
        }
    },

    /**
     * AUTH: Update Profile
     */
    async updateProfile(token: string, data: { fullName?: string, targetExam?: string }): Promise<{ profile?: UserProfile, error?: string }> {
        if (!this.isConfigured() || !token) return { error: "Not configured or missing token." };

        const updateData: any = {};
        if (data.fullName) updateData.full_name = data.fullName;
        if (data.targetExam) updateData.target_exam = data.targetExam;

        try {
            const res = await fetchWithTimeout(`${SUPABASE_URL}/auth/v1/user`, {
                method: 'PUT',
                headers: this.getHeaders(token),
                body: JSON.stringify({ data: updateData })
            });
            const result = await res.json();
            if (!res.ok) return { error: result.msg || "Update failed." };

            return {
                profile: {
                    id: result.id,
                    email: result.email,
                    fullName: result.user_metadata?.full_name || "Agent",
                    targetExam: result.user_metadata?.target_exam || "General"
                }
            };
        } catch (e: any) {
            return { error: e.message };
        }
    },

    /**
     * PEER NETWORKING: Join/Update
     */
    async joinPeerGroup(token: string, groupId: string, subject: string, status: string): Promise<string | null> {
        if (!this.isConfigured()) return null;

        try {
            const profile = await this.getProfile(token);
            if (!profile) return null;

            const response = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/study_peers`, {
                method: 'POST',
                headers: {
                    ...this.getHeaders(token),
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    user_id: profile.id,
                    group_id: groupId,
                    display_name: profile.fullName,
                    subject: subject,
                    status: status,
                    last_ping: new Date().toISOString()
                })
            });

            if (!response.ok) return null;
            const data = await response.json();
            return data[0]?.id;
        } catch (e) {
            return null;
        }
    },

    /**
     * PEER NETWORKING: Heartbeat
     */
    async sendHeartbeat(token: string, peerId: string, status: string, timer: number, subject: string): Promise<boolean> {
        if (!this.isConfigured()) return false;
        try {
            const response = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/study_peers?id=eq.${peerId}`, {
                method: 'PATCH',
                headers: this.getHeaders(token),
                body: JSON.stringify({
                    status,
                    timer_val: timer,
                    subject,
                    last_ping: new Date().toISOString()
                })
            });
            return response.ok;
        } catch (e) {
            return false;
        }
    },

    /**
     * PEER NETWORKING: Get Squad
     */
    async getPeers(groupId: string): Promise<any[]> {
        if (!this.isConfigured()) return [];
        try {
            const timeWindow = new Date(Date.now() - 2 * 60 * 1000).toISOString();

            const response = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/study_peers?group_id=eq.${groupId}&last_ping=gt.${timeWindow}&select=*`, {
                headers: this.getHeaders()
            });

            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            return [];
        }
    },

    /**
     * QUESTION ARCHIVE: Archive a question
     */
    async archiveQuestion(token: string, question: {
        question_text: string,
        options: string[],
        correct_index: number,
        explanation: string,
        subject: string,
        topic: string,
        difficulty: string,
        tags: string[]
    }): Promise<boolean> {
        if (!this.isConfigured()) return false;
        try {
            const profile = await this.getProfile(token);
            if (!profile) return false;

            const response = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/questions`, {
                method: 'POST',
                headers: this.getHeaders(token),
                body: JSON.stringify({
                    ...question,
                    author_id: profile.id
                })
            });
            return response.ok;
        } catch (e) {
            return false;
        }
    },

    /**
     * QUESTION ARCHIVE: Get questions with optional filters
     */
    async getQuestions(filters: {
        subject?: string,
        topic?: string,
        difficulty?: string,
        tags?: string[]
    } = {}): Promise<any[]> {
        if (!this.isConfigured()) return [];
        try {
            let query = `${SUPABASE_URL}/rest/v1/questions?select=*`;
            if (filters.subject) query += `&subject=eq.${filters.subject}`;
            if (filters.topic) query += `&topic=eq.${filters.topic}`;
            if (filters.difficulty) query += `&difficulty=eq.${filters.difficulty}`;
            if (filters.tags && filters.tags.length > 0) {
                const tagString = filters.tags.map(t => `"${t}"`).join(',');
                query += `&tags=cs.{${tagString}}`;
            }

            const response = await fetchWithTimeout(query, {
                headers: this.getHeaders()
            });

            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            return [];
        }
    },

    // =====================================================================
    // ENHANCED QUESTION DATABASE METHODS
    // =====================================================================

    /**
     * Get questions with full relational data (chapters, papers, tags)
     */
    async getQuestionsEnhanced(filters: {
        subject?: string,
        difficulty?: string,
        year?: number,
        exam_name?: string,
        chapter_id?: string,
        search_text?: string,
        limit?: number,
        offset?: number
    } = {}): Promise<any[]> {
        if (!this.isConfigured()) return [];
        try {
            // Use the database function for complex queries
            const response = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/rpc/get_questions_with_relations`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    p_subject: filters.subject || null,
                    p_difficulty: filters.difficulty || null,
                    p_year: filters.year || null,
                    p_exam_name: filters.exam_name || null,
                    p_chapter_id: filters.chapter_id || null,
                    p_limit: filters.limit || 50,
                    p_offset: filters.offset || 0
                })
            });

            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            console.error('Error fetching enhanced questions:', e);
            return [];
        }
    },

    /**
     * Get all exam papers
     */
    async getExamPapers(filters?: { year?: number, exam_name?: string }): Promise<any[]> {
        if (!this.isConfigured()) return [];
        try {
            let query = `${SUPABASE_URL}/rest/v1/exam_papers?select=*&order=year.desc,exam_name`;
            if (filters?.year) query += `&year=eq.${filters.year}`;
            if (filters?.exam_name) query += `&exam_name=eq.${filters.exam_name}`;

            const response = await fetchWithTimeout(query, {
                headers: this.getHeaders()
            });

            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            return [];
        }
    },

    /**
     * Get chapters by subject (with hierarchy)
     */
    async getChaptersBySubject(subject: string): Promise<any[]> {
        if (!this.isConfigured()) return [];
        try {
            const response = await fetchWithTimeout(
                `${SUPABASE_URL}/rest/v1/chapters?subject=eq.${subject}&order=order_index`,
                { headers: this.getHeaders() }
            );

            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            return [];
        }
    },

    /**
     * Get all tags
     */
    async getTags(category?: string): Promise<any[]> {
        if (!this.isConfigured()) return [];
        try {
            let query = `${SUPABASE_URL}/rest/v1/question_tags_master?select=*`;
            if (category) query += `&category=eq.${category}`;

            const response = await fetchWithTimeout(query, {
                headers: this.getHeaders()
            });

            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            return [];
        }
    },

    /**
     * Archive question with relationships (enhanced method)
     */
    async archiveQuestionEnhanced(
        token: string,
        question: {
            question_text: string,
            options: string[],
            correct_index: number,
            explanation: string,
            subject: string,
            topic: string,
            difficulty: string,
            nested_tags?: Record<string, string>,
            question_image_url?: string,
            option_image_urls?: string[]
        },
        chapterIds: string[] = [],
        paperIds: string[] = [],
        tagIds: string[] = []
    ): Promise<{ success: boolean, questionId?: string, error?: string }> {
        if (!this.isConfigured()) return { success: false, error: 'Not configured' };

        try {
            const profile = await this.getProfile(token);
            if (!profile) return { success: false, error: 'Not authenticated' };

            // 1. Create question
            const questionResponse = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/questions`, {
                method: 'POST',
                headers: {
                    ...this.getHeaders(token),
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    ...question,
                    author_id: profile.id
                })
            });

            if (!questionResponse.ok) {
                return { success: false, error: 'Failed to create question' };
            }

            const [createdQuestion] = await questionResponse.json();
            const questionId = createdQuestion.id;

            // 2. Link to chapters
            if (chapterIds.length > 0) {
                const chapterLinks = chapterIds.map((chapterId, index) => ({
                    question_id: questionId,
                    chapter_id: chapterId,
                    is_primary: index === 0
                }));

                await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/question_chapters`, {
                    method: 'POST',
                    headers: this.getHeaders(token),
                    body: JSON.stringify(chapterLinks)
                });
            }

            // 3. Link to papers
            if (paperIds.length > 0) {
                const paperLinks = paperIds.map((paperId, index) => ({
                    question_id: questionId,
                    paper_id: paperId,
                    question_number: index + 1,
                    marks: 4
                }));

                await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/question_papers`, {
                    method: 'POST',
                    headers: this.getHeaders(token),
                    body: JSON.stringify(paperLinks)
                });
            }

            // 4. Link to tags
            if (tagIds.length > 0) {
                const tagLinks = tagIds.map(tagId => ({
                    question_id: questionId,
                    tag_id: tagId
                }));

                await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/question_tags`, {
                    method: 'POST',
                    headers: this.getHeaders(token),
                    body: JSON.stringify(tagLinks)
                });
            }

            return { success: true, questionId };

        } catch (e: any) {
            return { success: false, error: e.message };
        }
    },

    /**
     * Get question statistics
     */
    async getQuestionStats(): Promise<any> {
        if (!this.isConfigured()) return null;
        try {
            const [bySubject, byYear, byChapter] = await Promise.all([
                fetchWithTimeout(`${SUPABASE_URL}/rest/v1/question_stats_by_subject`, {
                    headers: this.getHeaders()
                }),
                fetchWithTimeout(`${SUPABASE_URL}/rest/v1/question_stats_by_year`, {
                    headers: this.getHeaders()
                }),
                fetchWithTimeout(`${SUPABASE_URL}/rest/v1/question_stats_by_chapter`, {
                    headers: this.getHeaders()
                })
            ]);

            return {
                by_subject: bySubject.ok ? await bySubject.json() : [],
                by_year: byYear.ok ? await byYear.json() : [],
                by_chapter: byChapter.ok ? await byChapter.json() : []
            };
        } catch (e) {
            return null;
        }
    }
};

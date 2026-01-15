
/**
 * Cloud Service Layer
 * Securely connects to Supabase Auth and Database
 */

export interface UserProfile {
    id: string;
    email: string;
    fullName: string;
    targetExam: string;
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
    }
};

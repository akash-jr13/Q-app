// import { createClient } from '@supabase/supabase-js'; // Install this package to run migration script directly
import {
    // Types would be imported here
} from '../types';

/**
 * Migration utilities for transitioning existing questions to the new
 * multi-dimensional schema with exam papers and chapters
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase: any = null;

// Initialize Supabase client
if (supabaseUrl && supabaseKey) {
    // supabase = createClient(supabaseUrl, supabaseKey);
    console.warn("To run migration, uncomment createClient above and install @supabase/supabase-js");
}

/**
 * Check if migration is needed
 */
export async function needsMigration(): Promise<boolean> {
    if (!supabase) return false;

    try {
        // Check if enhanced tables exist
        const { error } = await supabase
            .from('exam_papers')
            .select('id')
            .limit(1);

        if (error) {
            console.log('Enhanced tables not found, migration needed');
            return true;
        }

        // Check if there are questions without chapter/paper links
        const { data: unlinkedQuestions } = await supabase
            .from('questions')
            .select('id')
            .limit(1);

        if (unlinkedQuestions && unlinkedQuestions.length > 0) {
            const { data: links } = await supabase
                .from('question_chapters')
                .select('question_id')
                .eq('question_id', unlinkedQuestions[0].id);

            return !links || links.length === 0;
        }

        return false;
    } catch (error) {
        console.error('Error checking migration status:', error);
        return false;
    }
}

/**
 * Migrate existing questions to new schema
 * This creates default chapter and paper links for existing questions
 */
export async function migrateExistingQuestions(): Promise<{
    success: boolean;
    migrated: number;
    errors: string[];
}> {
    if (!supabase) {
        return { success: false, migrated: 0, errors: ['Supabase client not initialized - install @supabase/supabase-js'] };
    }

    const errors: string[] = [];
    let migrated = 0;

    try {
        console.log('Starting question migration...');

        // Get all existing questions
        const { data: questions, error: fetchError } = await supabase
            .from('questions')
            .select('*');

        if (fetchError) {
            errors.push(`Failed to fetch questions: ${fetchError.message}`);
            return { success: false, migrated: 0, errors };
        }

        if (!questions || questions.length === 0) {
            console.log('No questions to migrate');
            return { success: true, migrated: 0, errors: [] };
        }

        console.log(`Found ${questions.length} questions to migrate`);

        // Get or create default chapters for each subject
        const chapterMap = new Map<string, string>();

        for (const question of questions) {
            const subject = question.subject;

            if (!chapterMap.has(subject)) {
                // Find or create a default chapter for this subject
                const { data: existingChapter } = await supabase
                    .from('chapters')
                    .select('id')
                    .eq('subject', subject)
                    .eq('chapter_name', 'General')
                    .single();

                if (existingChapter) {
                    chapterMap.set(subject, existingChapter.id);
                } else {
                    // Create default chapter
                    const { data: newChapter, error: chapterError } = await supabase
                        .from('chapters')
                        .insert({
                            subject,
                            chapter_name: 'General',
                            order_index: 0,
                            description: 'Default chapter for migrated questions'
                        })
                        .select('id')
                        .single();

                    if (chapterError) {
                        errors.push(`Failed to create chapter for ${subject}: ${chapterError.message}`);
                        continue;
                    }

                    chapterMap.set(subject, newChapter.id);
                }
            }

            // Link question to chapter
            const chapterId = chapterMap.get(subject);
            if (chapterId) {
                const { error: linkError } = await supabase
                    .from('question_chapters')
                    .insert({
                        question_id: question.id,
                        chapter_id: chapterId,
                        is_primary: true
                    });

                if (linkError && !linkError.message.includes('duplicate')) {
                    errors.push(`Failed to link question ${question.id} to chapter: ${linkError.message}`);
                } else {
                    migrated++;
                }
            }

            // If question has legacy tags with year information, create exam paper links
            if (question.tags && Array.isArray(question.tags)) {
                for (const tag of question.tags) {
                    const yearMatch = tag.match(/(\d{4})/);
                    if (yearMatch) {
                        const year = parseInt(yearMatch[1]);
                        const examName = tag.includes('JEE Main') ? 'JEE Main' :
                            tag.includes('JEE Advanced') ? 'JEE Advanced' :
                                tag.includes('NEET') ? 'NEET' : 'Other';

                        // Find or create exam paper
                        const { data: existingPaper } = await supabase
                            .from('exam_papers')
                            .select('id')
                            .eq('year', year)
                            .eq('exam_name', examName)
                            .single();

                        let paperId = existingPaper?.id;

                        if (!paperId) {
                            const { data: newPaper, error: paperError } = await supabase
                                .from('exam_papers')
                                .insert({
                                    year,
                                    exam_name: examName,
                                    total_marks: 300,
                                    description: `Migrated from legacy tags`
                                })
                                .select('id')
                                .single();

                            if (paperError) {
                                errors.push(`Failed to create paper for ${year} ${examName}: ${paperError.message}`);
                                continue;
                            }

                            paperId = newPaper.id;
                        }

                        // Link question to paper
                        const { error: paperLinkError } = await supabase
                            .from('question_papers')
                            .insert({
                                question_id: question.id,
                                paper_id: paperId,
                                question_number: 1,
                                marks: 4
                            });

                        if (paperLinkError && !paperLinkError.message.includes('duplicate')) {
                            errors.push(`Failed to link question ${question.id} to paper: ${paperLinkError.message}`);
                        }
                    }
                }
            }
        }

        console.log(`Migration complete: ${migrated} questions migrated`);
        return { success: true, migrated, errors };

    } catch (error: any) {
        errors.push(`Migration failed: ${error.message}`);
        return { success: false, migrated, errors };
    }
}

/**
 * Validate migration integrity
 */
export async function validateMigration(): Promise<{
    valid: boolean;
    issues: string[];
}> {
    if (!supabase) {
        return { valid: false, issues: ['Supabase client not initialized'] };
    }

    const issues: string[] = [];

    try {
        // Check for orphaned questions (no chapter links)
        const { data: orphanedQuestions, error: orphanError } = await supabase
            .rpc('find_orphaned_questions');

        if (orphanError) {
            issues.push(`Failed to check orphaned questions: ${orphanError.message}`);
        } else if (orphanedQuestions && orphanedQuestions.length > 0) {
            issues.push(`Found ${orphanedQuestions.length} questions without chapter links`);
        }

        // Check for duplicate links
        const { data: duplicateLinks, error: dupError } = await supabase
            .from('question_chapters')
            .select('question_id, chapter_id, count')
            .group('question_id, chapter_id')
            .having('count(*) > 1');

        if (dupError) {
            issues.push(`Failed to check duplicate links: ${dupError.message}`);
        } else if (duplicateLinks && duplicateLinks.length > 0) {
            issues.push(`Found ${duplicateLinks.length} duplicate question-chapter links`);
        }

        return { valid: issues.length === 0, issues };

    } catch (error: any) {
        issues.push(`Validation failed: ${error.message}`);
        return { valid: false, issues };
    }
}

/**
 * Get migration status report
 */
export async function getMigrationStatus(): Promise<{
    totalQuestions: number;
    linkedToChapters: number;
    linkedToPapers: number;
    orphaned: number;
}> {
    if (!supabase) {
        return { totalQuestions: 0, linkedToChapters: 0, linkedToPapers: 0, orphaned: 0 };
    }

    try {
        // Total questions
        const { count: totalQuestions } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true });

        // Questions with chapter links
        const { data: chapterLinks } = await supabase
            .from('question_chapters')
            .select('question_id');

        const linkedToChapters = new Set((chapterLinks || []).map((l: { question_id: string }) => l.question_id)).size;

        // Questions with paper links
        const { data: paperLinks } = await supabase
            .from('question_papers')
            .select('question_id');

        const linkedToPapers = new Set((paperLinks || []).map((l: { question_id: string }) => l.question_id)).size;

        const orphaned = (totalQuestions || 0) - linkedToChapters;

        return {
            totalQuestions: totalQuestions || 0,
            linkedToChapters,
            linkedToPapers,
            orphaned
        };

    } catch (error) {
        console.error('Error getting migration status:', error);
        return { totalQuestions: 0, linkedToChapters: 0, linkedToPapers: 0, orphaned: 0 };
    }
}

/**
 * Rollback migration (remove all links, keep questions intact)
 */
export async function rollbackMigration(): Promise<boolean> {
    if (!supabase) return false;

    try {
        console.log('Rolling back migration...');

        // Delete all question-chapter links
        await supabase.from('question_chapters').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // Delete all question-paper links
        await supabase.from('question_papers').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // Delete all question-tag links
        await supabase.from('question_tags').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        console.log('Rollback complete');
        return true;

    } catch (error) {
        console.error('Rollback failed:', error);
        return false;
    }
}

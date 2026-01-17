import { AuthoredQuestion, QuestionBank } from '../types';

/**
 * Utility functions for managing offline question banks
 * Supports export, import, encryption, and validation
 */

// Generate a unique ID for questions
export const generateQuestionId = (): string => {
    return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Validate question structure
export const validateQuestion = (question: Partial<AuthoredQuestion>): boolean => {
    if (!question.question_text || question.question_text.trim() === '') return false;
    if (!question.options || question.options.length < 2) return false;
    if (question.options.some(opt => !opt || opt.trim() === '')) return false;
    if (question.correct_index === undefined || question.correct_index < 0 || question.correct_index >= question.options.length) return false;
    if (!question.subject || !question.difficulty) return false;
    return true;
};

// Create a new question bank
export const createQuestionBank = (
    name: string,
    author: string,
    description: string = '',
    questions: AuthoredQuestion[] = []
): QuestionBank => {
    return {
        name,
        version: '1.0.0',
        created_at: new Date().toISOString(),
        questions,
        metadata: {
            author,
            description,
            encrypted: false
        }
    };
};

// Export question bank to JSON
export const exportQuestionBank = (bank: QuestionBank): string => {
    return JSON.stringify(bank, null, 2);
};

// Import question bank from JSON
export const importQuestionBank = (jsonString: string): QuestionBank | null => {
    try {
        const bank = JSON.parse(jsonString) as QuestionBank;

        // Validate structure
        if (!bank.name || !bank.version || !bank.questions || !Array.isArray(bank.questions)) {
            console.error('Invalid question bank structure');
            return null;
        }

        // Validate all questions
        const allValid = bank.questions.every(q => validateQuestion(q));
        if (!allValid) {
            console.error('Some questions in the bank are invalid');
            return null;
        }

        return bank;
    } catch (error) {
        console.error('Failed to parse question bank:', error);
        return null;
    }
};

// Download question bank as file
export const downloadQuestionBank = (bank: QuestionBank, filename?: string): void => {
    const json = exportQuestionBank(bank);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${bank.name.replace(/\s+/g, '_')}.qbank`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// Read question bank from file
export const readQuestionBankFile = (file: File): Promise<QuestionBank | null> => {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const content = e.target?.result as string;
            const bank = importQuestionBank(content);
            resolve(bank);
        };

        reader.onerror = () => {
            console.error('Failed to read file');
            resolve(null);
        };

        reader.readAsText(file);
    });
};

// Merge multiple question banks
export const mergeQuestionBanks = (banks: QuestionBank[], newName: string): QuestionBank => {
    const allQuestions: AuthoredQuestion[] = [];
    const allAuthors = new Set<string>();

    banks.forEach(bank => {
        allQuestions.push(...bank.questions);
        allAuthors.add(bank.metadata.author);
    });

    return createQuestionBank(
        newName,
        Array.from(allAuthors).join(', '),
        `Merged from ${banks.length} question banks`,
        allQuestions
    );
};

// Simple encryption (Base64 encoding - for basic obfuscation, not cryptographic security)
export const encryptQuestionBank = (bank: QuestionBank, password: string): string => {
    const json = exportQuestionBank(bank);
    const encoded = btoa(unescape(encodeURIComponent(json + '::' + password)));
    return encoded;
};

// Simple decryption
export const decryptQuestionBank = (encrypted: string, password: string): QuestionBank | null => {
    try {
        const decoded = decodeURIComponent(escape(atob(encrypted)));
        const parts = decoded.split('::');

        if (parts.length < 2 || parts[parts.length - 1] !== password) {
            console.error('Invalid password');
            return null;
        }

        const json = parts.slice(0, -1).join('::');
        return importQuestionBank(json);
    } catch (error) {
        console.error('Decryption failed:', error);
        return null;
    }
};

// Get statistics from question bank
export const getQuestionBankStats = (bank: QuestionBank) => {
    const subjects = new Set(bank.questions.map(q => q.subject));
    const topics = new Set(bank.questions.map(q => q.topic).filter(Boolean));
    const tags = new Set(bank.questions.flatMap(q => q.tags));

    const difficultyCount = {
        Easy: bank.questions.filter(q => q.difficulty === 'Easy').length,
        Medium: bank.questions.filter(q => q.difficulty === 'Medium').length,
        Hard: bank.questions.filter(q => q.difficulty === 'Hard').length
    };

    return {
        totalQuestions: bank.questions.length,
        subjects: Array.from(subjects),
        topics: Array.from(topics),
        tags: Array.from(tags),
        difficultyDistribution: difficultyCount
    };
};

// Filter questions by criteria
export const filterQuestions = (
    questions: AuthoredQuestion[],
    filters: {
        subject?: string;
        topic?: string;
        difficulty?: string;
        tags?: string[];
        searchText?: string;
    }
): AuthoredQuestion[] => {
    return questions.filter(q => {
        if (filters.subject && q.subject !== filters.subject) return false;
        if (filters.topic && q.topic !== filters.topic) return false;
        if (filters.difficulty && q.difficulty !== filters.difficulty) return false;
        if (filters.tags && filters.tags.length > 0) {
            const hasTag = filters.tags.some(tag => q.tags.includes(tag));
            if (!hasTag) return false;
        }
        if (filters.searchText) {
            const searchLower = filters.searchText.toLowerCase();
            const matchesText = q.question_text.toLowerCase().includes(searchLower) ||
                q.options.some(opt => opt.toLowerCase().includes(searchLower)) ||
                q.tags.some(tag => tag.toLowerCase().includes(searchLower));
            if (!matchesText) return false;
        }
        return true;
    });
};

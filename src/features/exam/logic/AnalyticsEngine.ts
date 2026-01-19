import type { Question } from '../store/types';

export interface PerformanceMetric {
    topic: string;
    total: number;
    correct: number;
    accuracy: number;
    status: 'Strong' | 'Weak' | 'Average' | 'Mastered' | 'Critical';
}

export class AnalyticsEngine {

    /**
     * Calculates performance metrics grouped by Topic.
     * O(N) complexity.
     */
    static calculateTopicPerformance(
        questions: Question[],
        answers: Record<number, number>
    ): PerformanceMetric[] {
        const topicMap = new Map<string, { total: number, correct: number }>();

        questions.forEach(q => {
            const topic = q.topic || 'General';
            const stats = topicMap.get(topic) || { total: 0, correct: 0 };

            stats.total++;
            if (answers[q.id] === q.correctAnswer) {
                stats.correct++;
            }
            topicMap.set(topic, stats);
        });

        return Array.from(topicMap.entries()).map(([topic, stats]) => {
            const accuracy = Math.round((stats.correct / stats.total) * 100);
            let status: PerformanceMetric['status'] = 'Average';

            if (accuracy >= 90) status = 'Mastered';
            else if (accuracy >= 75) status = 'Strong';
            else if (accuracy < 40) status = 'Critical';
            else if (accuracy < 60) status = 'Weak';

            return { topic, total: stats.total, correct: stats.correct, accuracy, status };
        }).sort((a, b) => b.accuracy - a.accuracy); // Best topics first
    }

    /**
     * Generates "Godfather" strategic advice based on performance.
     * Heuristic-based logic engine.
     */
    static generateStrategicAdvice(overallScore: number, metrics: PerformanceMetric[]): string {
        if (overallScore === 100) return "Perfect execution. You are ready for the highest level of operations.";
        if (overallScore === 0) return "System failure imminent. Complete reboot of foundational knowledge required.";

        const weaktopics = metrics.filter(m => m.status === 'Critical' || m.status === 'Weak');
        const strongTopics = metrics.filter(m => m.status === 'Mastered' || m.status === 'Strong');

        if (weaktopics.length > 0) {
            const worst = weaktopics[weaktopics.length - 1]; // Sorted desc, so last is worst
            return `Tactical Alert: Your performance in '${worst.topic}' is compromising the mission. Immediate reinforcement required.`;
        }

        if (strongTopics.length === metrics.length) {
            return "Solid performance across all sectors. Maintain current operational tempo.";
        }

        return "Performance is nominal, but inconsistencies remain. Focus on eliminating random errors.";
    }
}

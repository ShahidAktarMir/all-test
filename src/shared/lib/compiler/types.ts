export const TokenType = {
    SEPARATOR: 'SEPARATOR',         // ###, ---
    QUESTION_NUMBER: 'QUESTION_NUMBER', // Q1., Question 1
    OPTION_LABEL: 'OPTION_LABEL',   // (A), A., [A]
    ANSWER_LABEL: 'ANSWER_LABEL',   // Correct Answer:, [Ans]:
    TAG_OPEN: 'TAG_OPEN',           // [
    TAG_CLOSE: 'TAG_CLOSE',         // ]
    TAG_LABEL: 'TAG_LABEL',         // Topic, Source, Godfather Insight (inside tag)
    TEXT: 'TEXT',                   // Regular text content
    EOF: 'EOF'
} as const;

export type TokenType = typeof TokenType[keyof typeof TokenType];

export interface Token {
    type: TokenType;
    value: string;
    line: number;
    raw: string;
}

export interface ASTNode {
    type: string;
}

export interface QuestionNode extends ASTNode {
    type: 'Question';
    id: number | null; // Extracted from text if present
    body: string;
    options: OptionNode[];
    answer: AnswerNode | null;
    metadata: MetadataNode[];
}

export interface OptionNode extends ASTNode {
    type: 'Option';
    label: string; // A, B, C...
    content: string;
}

export interface AnswerNode extends ASTNode {
    type: 'Answer';
    value: string; // A, B, C...
}

export interface MetadataNode extends ASTNode {
    type: 'Metadata';
    key: string;
    value: string;
}

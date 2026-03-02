import { NextResponse } from 'next/server';

export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found') {
        super(message, 404);
    }
}

export class ValidationError extends AppError {
    constructor(message: string = 'Validation failed') {
        super(message, 400);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized access') {
        super(message, 401);
    }
}

export function handleApiError(error: unknown) {
    console.error('[API Error]:', error);

    if (error instanceof AppError) {
        return NextResponse.json(
            { error: error.message, isOperational: error.isOperational },
            { status: error.statusCode }
        );
    }

    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
        { error: 'Internal Server Error', message },
        { status: 500 }
    );
}

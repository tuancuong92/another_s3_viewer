import { CreateBucketCommand, DeleteBucketCommand, GetBucketPolicyCommand, ListBucketsCommand, PutBucketPolicyCommand, S3Client } from '@aws-sdk/client-s3';
import { S3Connection } from '../store/connectionStore';

const clients: Record<string, S3Client> = {};

export class S3ServiceError extends Error {
    public readonly code: string;
    public readonly operation: string;

    constructor(operation: string, originalError: unknown) {
        const message = originalError instanceof Error
            ? originalError.message.replace(/AccessKey\w+/gi, '[REDACTED]').replace(/SecretKey\w+/gi, '[REDACTED]')
            : 'Unknown S3 error';
        super(`S3 ${operation} failed: ${message}`);
        this.name = 'S3ServiceError';
        this.operation = operation;
        this.code = (originalError as any)?.Code || (originalError as any)?.$metadata?.httpStatusCode?.toString() || 'UNKNOWN';
    }
}

export const getS3Client = (connection: S3Connection) => {
    if (!clients[connection.id]) {
        // Validate endpoint URL
        const endpoint = connection.endpoint;
        if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
            throw new S3ServiceError('getClient', new Error('Endpoint must start with http:// or https://'));
        }

        try {
            clients[connection.id] = new S3Client({
                endpoint: connection.endpoint,
                region: connection.region,
                credentials: {
                    accessKeyId: connection.accessKeyId,
                    secretAccessKey: connection.secretAccessKey,
                },
                forcePathStyle: true, // Needed for MinIO/compatible
            });
        } catch (error) {
            const sanitizedError = new S3ServiceError('getClient', error);
            console.error(sanitizedError);
            throw sanitizedError;
        }
    }
    return clients[connection.id];
};

export const removeClient = (connectionId: string) => {
    if (clients[connectionId]) {
        delete clients[connectionId];
    }
};

export const listBuckets = async (connection: S3Connection) => {
    try {
        const client = getS3Client(connection);
        const command = new ListBucketsCommand({});
        const response = await client.send(command);
        return response.Buckets || [];
    } catch (error) {
        const sanitizedError = error instanceof S3ServiceError ? error : new S3ServiceError('listBuckets', error);
        console.error(sanitizedError);
        throw sanitizedError;
    }
};

export const createBucket = async (connection: S3Connection, bucketName: string) => {
    try {
        const client = getS3Client(connection);
        const command = new CreateBucketCommand({ Bucket: bucketName });
        return await client.send(command);
    } catch (error) {
        const sanitizedError = error instanceof S3ServiceError ? error : new S3ServiceError('createBucket', error);
        console.error(sanitizedError);
        throw sanitizedError;
    }
};

export const deleteBucket = async (connection: S3Connection, bucketName: string) => {
    try {
        const client = getS3Client(connection);
        const command = new DeleteBucketCommand({ Bucket: bucketName });
        return await client.send(command);
    } catch (error) {
        const sanitizedError = error instanceof S3ServiceError ? error : new S3ServiceError('deleteBucket', error);
        console.error(sanitizedError);
        throw sanitizedError;
    }
}

// Interface for bucket policy
interface BucketPolicy {
    Version: string;
    Statement: PolicyStatement[];
}

interface PolicyStatement {
    Sid?: string;
    Effect: 'Allow' | 'Deny';
    Principal?: { AWS: string | string[] } | string;
    Action: string | string[];
    Resource: string | string[];
    Condition?: Record<string, unknown>;
}

/**
 * Check if a bucket is publicly accessible via bucket policy
 */
export const isBucketPublic = async (connection: S3Connection, bucketName: string): Promise<boolean> => {
    try {
        const client = getS3Client(connection);
        const command = new GetBucketPolicyCommand({
            Bucket: bucketName,
        });
        const response = await client.send(command);
        
        if (!response.Policy) {
            return false;
        }

        const policy: BucketPolicy = JSON.parse(response.Policy);
        const bucketResource = `arn:aws:s3:::${bucketName}/*`;

        // Check if any statement allows public GetObject for all objects in the bucket
        return policy.Statement.some(statement => {
            if (statement.Effect !== 'Allow') return false;
            if (statement.Principal !== '*') return false;
            
            const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
            const resources = Array.isArray(statement.Resource) ? statement.Resource : [statement.Resource];

            return actions.includes('s3:GetObject') &&
                   resources.some(resource =>
                       resource === bucketResource
                   );
        });
    } catch (error) {
        // NoSuchBucketPolicy means no policy exists, so bucket is not public
        if ((error as { name?: string }).name === 'NoSuchBucketPolicy') {
            return false;
        }
        const sanitizedError = error instanceof S3ServiceError ? error : new S3ServiceError('isBucketPublic', error);
        console.error(sanitizedError);
        throw sanitizedError;
    }
};

/**
 * Set public access for a bucket via bucket policy
 * This allows public read access to all objects in the bucket
 */
export const setBucketPublic = async (connection: S3Connection, bucketName: string, isPublic: boolean): Promise<void> => {
    try {
        const client = getS3Client(connection);
        
        // Get current policy
        let policy: BucketPolicy;
        try {
            const getPolicyCommand = new GetBucketPolicyCommand({
                Bucket: bucketName,
            });
            const response = await client.send(getPolicyCommand);
            policy = JSON.parse(response.Policy!);
        } catch (error) {
            if ((error as { name?: string }).name === 'NoSuchBucketPolicy') {
                // No policy exists, create a new one
                policy = {
                    Version: '2012-10-17',
                    Statement: [],
                };
            } else {
                throw error;
            }
        }

        const bucketResource = `arn:aws:s3:::${bucketName}/*`;
        const publicStatementId = `PublicAccess-BucketAllObjects`;

        if (isPublic) {
            // Add or update the public access statement
            const existingIndex = policy.Statement.findIndex(
                stmt => stmt.Sid === publicStatementId
            );

            const publicStatement: PolicyStatement = {
                Sid: publicStatementId,
                Effect: 'Allow',
                Principal: '*',
                Action: 's3:GetObject',
                Resource: bucketResource,
            };

            if (existingIndex >= 0) {
                policy.Statement[existingIndex] = publicStatement;
            } else {
                policy.Statement.push(publicStatement);
            }
        } else {
            // Remove the public access statement
            policy.Statement = policy.Statement.filter(
                stmt => stmt.Sid !== publicStatementId
            );

            // If no statements remain, delete the policy
            if (policy.Statement.length === 0) {
                const deleteCommand = new PutBucketPolicyCommand({
                    Bucket: bucketName,
                    Policy: '',
                });
                await client.send(deleteCommand);
                return;
            }
        }

        // Save the updated policy
        const putPolicyCommand = new PutBucketPolicyCommand({
            Bucket: bucketName,
            Policy: JSON.stringify(policy),
        });
        await client.send(putPolicyCommand);
    } catch (error) {
        const sanitizedError = error instanceof S3ServiceError ? error : new S3ServiceError('setBucketPublic', error);
        console.error(sanitizedError);
        throw sanitizedError;
    }
};

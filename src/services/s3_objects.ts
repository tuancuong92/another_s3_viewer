import { ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, DeleteObjectsCommand, CopyObjectCommand, GetBucketPolicyCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Connection } from '../store/connectionStore';
import { getS3Client, S3ServiceError } from './s3';

export const listObjects = async (connection: S3Connection, bucketName: string, prefix = '') => {
    try {
        const client = getS3Client(connection);
        const command = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: prefix,
            Delimiter: '/',
        });
        const response = await client.send(command);
        return {
            objects: response.Contents || [],
            folders: response.CommonPrefixes || [],
        };
    } catch (error) {
        const sanitizedError = error instanceof S3ServiceError ? error : new S3ServiceError('listObjects', error);
        console.error(sanitizedError);
        throw sanitizedError;
    }
};

export const uploadObject = async (connection: S3Connection, bucketName: string, key: string, file: File | Blob) => {
    try {
        const client = getS3Client(connection);
        let body: Uint8Array;
        if (file instanceof File) {
            const arrayBuffer = await file.arrayBuffer();
            body = new Uint8Array(arrayBuffer);
        } else {
            const arrayBuffer = await file.arrayBuffer();
            body = new Uint8Array(arrayBuffer);
        }

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: body,
            ContentType: file instanceof File ? file.type : undefined,
        });
        return await client.send(command);
    } catch (error) {
        const sanitizedError = error instanceof S3ServiceError ? error : new S3ServiceError('uploadObject', error);
        console.error(sanitizedError);
        throw sanitizedError;
    }
};

export const deleteObject = async (connection: S3Connection, bucketName: string, key: string) => {
    try {
        const client = getS3Client(connection);
        const command = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
        });
        return await client.send(command);
    } catch (error) {
        const sanitizedError = error instanceof S3ServiceError ? error : new S3ServiceError('deleteObject', error);
        console.error(sanitizedError);
        throw sanitizedError;
    }
}

export const deleteObjects = async (connection: S3Connection, bucketName: string, keys: string[]) => {
    try {
        const client = getS3Client(connection);
        const command = new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete: {
                Objects: keys.map(Key => ({ Key })),
            },
        });
        return await client.send(command);
    } catch (error) {
        const sanitizedError = error instanceof S3ServiceError ? error : new S3ServiceError('deleteObjects', error);
        console.error(sanitizedError);
        throw sanitizedError;
    }
}

export const copyObject = async (connection: S3Connection, bucketName: string, sourceKey: string, destinationKey: string) => {
    try {
        const client = getS3Client(connection);
        const command = new CopyObjectCommand({
            Bucket: bucketName,
            CopySource: `${bucketName}/${sourceKey}`,
            Key: destinationKey,
        });
        return await client.send(command);
    } catch (error) {
        const sanitizedError = error instanceof S3ServiceError ? error : new S3ServiceError('copyObject', error);
        console.error(sanitizedError);
        throw sanitizedError;
    }
}

export const moveObject = async (connection: S3Connection, bucketName: string, sourceKey: string, destinationKey: string) => {
    try {
        const client = getS3Client(connection);
        
        if (sourceKey.endsWith('/')) {
            // It's a folder, need recursive move
            let continuationToken: string | undefined;
            const objectsToDelete: string[] = [];
            
            do {
                const listCommand = new ListObjectsV2Command({
                    Bucket: bucketName,
                    Prefix: sourceKey,
                    ContinuationToken: continuationToken,
                });
                const listResponse = await client.send(listCommand);
                
                if (listResponse.Contents) {
                    for (const obj of listResponse.Contents) {
                        if (!obj.Key) continue;
                        
                        const newKey = destinationKey + obj.Key.substring(sourceKey.length);
                        
                        // Copy object
                        const copyCommand = new CopyObjectCommand({
                            Bucket: bucketName,
                            CopySource: `${bucketName}/${obj.Key}`,
                            Key: newKey,
                        });
                        await client.send(copyCommand);
                        objectsToDelete.push(obj.Key);
                    }
                }
                
                continuationToken = listResponse.NextContinuationToken;
            } while (continuationToken);

            // Bulk delete old objects
            if (objectsToDelete.length > 0) {
                // S3 DeleteObjects supports up to 1000 keys at once
                for (let i = 0; i < objectsToDelete.length; i += 1000) {
                    const chunk = objectsToDelete.slice(i, i + 1000);
                    const deleteCommand = new DeleteObjectsCommand({
                        Bucket: bucketName,
                        Delete: {
                            Objects: chunk.map(Key => ({ Key })),
                        },
                    });
                    await client.send(deleteCommand);
                }
            }
        } else {
            // It's a single file
            const copyCommand = new CopyObjectCommand({
                Bucket: bucketName,
                CopySource: `${bucketName}/${sourceKey}`,
                Key: destinationKey,
            });
            await client.send(copyCommand);
            
            const deleteCommand = new DeleteObjectCommand({
                Bucket: bucketName,
                Key: sourceKey,
            });
            await client.send(deleteCommand);
        }
    } catch (error) {
        const sanitizedError = error instanceof S3ServiceError ? error : new S3ServiceError('moveObject', error);
        console.error(sanitizedError);
        throw sanitizedError;
    }
}

export const getObjectContent = async (connection: S3Connection, bucketName: string, key: string) => {
    try {
        const client = getS3Client(connection);
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
        });
        const response = await client.send(command);
        return await response.Body?.transformToString();
    } catch (error) {
        const sanitizedError = error instanceof S3ServiceError ? error : new S3ServiceError('getObjectContent', error);
        console.error(sanitizedError);
        throw sanitizedError;
    }
}

export const getObjectUrl = async (connection: S3Connection, bucketName: string, key: string) => {
    try {
        const client = getS3Client(connection);
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
        });
        return await getSignedUrl(client, command, { expiresIn: 3600 });
    } catch (error) {
        const sanitizedError = error instanceof S3ServiceError ? error : new S3ServiceError('getObjectUrl', error);
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
 * Check if a specific object is publicly accessible via bucket policy
 */
export const isObjectPublic = async (connection: S3Connection, bucketName: string, key: string): Promise<boolean> => {
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
        const objectResource = `arn:aws:s3:::${bucketName}/${key}`;

        // Helper function to check if Principal allows public access (*)
        const isPublicPrincipal = (principal: PolicyStatement['Principal']): boolean => {
            if (principal === '*') return true;
            if (typeof principal === 'object' && principal !== null) {
                // Handle { "AWS": "*" } or { "AWS": ["*"] }
                const awsPrincipal = principal.AWS;
                if (awsPrincipal === '*') return true;
                if (Array.isArray(awsPrincipal) && awsPrincipal.includes('*')) return true;
            }
            return false;
        };

        // Check if any statement allows public GetObject for this specific object
        return policy.Statement.some(statement => {
            if (statement.Effect !== 'Allow') return false;
            if (!isPublicPrincipal(statement.Principal)) return false;
            
            const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
            const resources = Array.isArray(statement.Resource) ? statement.Resource : [statement.Resource];

            return actions.includes('s3:GetObject') &&
                   resources.some(resource =>
                       resource === objectResource ||
                       resource === `arn:aws:s3:::${bucketName}/*` ||
                       resource === `arn:aws:s3:::${bucketName}/${key}/*`
                   );
        });
    } catch (error) {
        // NoSuchBucketPolicy means no policy exists, so object is not public
        if ((error as { name?: string }).name === 'NoSuchBucketPolicy') {
            return false;
        }
        const sanitizedError = error instanceof S3ServiceError ? error : new S3ServiceError('isObjectPublic', error);
        console.error(sanitizedError);
        throw sanitizedError;
    }
};

/**
 * Set public access for a specific object via bucket policy
 */
export const setObjectPublic = async (connection: S3Connection, bucketName: string, key: string, isPublic: boolean): Promise<void> => {
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

        const objectResource = `arn:aws:s3:::${bucketName}/${key}`;
        const publicStatementId = `PublicAccess-${key.replace(/[^a-zA-Z0-9]/g, '-')}`;

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
                Resource: objectResource,
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
        const sanitizedError = error instanceof S3ServiceError ? error : new S3ServiceError('setObjectPublic', error);
        console.error(sanitizedError);
        throw sanitizedError;
    }
};

/**
 * Get all public objects from bucket policy
 * Returns a Set of object keys that have public access
 */
export const getPublicObjects = async (connection: S3Connection, bucketName: string): Promise<Set<string>> => {
    try {
        const client = getS3Client(connection);
        const command = new GetBucketPolicyCommand({
            Bucket: bucketName,
        });
        const response = await client.send(command);
        
        if (!response.Policy) {
            return new Set();
        }

        const policy: BucketPolicy = JSON.parse(response.Policy);
        const publicKeys = new Set<string>();

        // Helper function to check if Principal allows public access (*)
        const isPublicPrincipal = (principal: PolicyStatement['Principal']): boolean => {
            if (principal === '*') return true;
            if (typeof principal === 'object' && principal !== null) {
                const awsPrincipal = principal.AWS;
                if (awsPrincipal === '*') return true;
                if (Array.isArray(awsPrincipal) && awsPrincipal.includes('*')) return true;
            }
            return false;
        };

        // Extract public keys from policy statements
        for (const statement of policy.Statement) {
            if (statement.Effect !== 'Allow') continue;
            if (!isPublicPrincipal(statement.Principal)) continue;
            
            const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
            if (!actions.includes('s3:GetObject')) continue;
            
            const resources = Array.isArray(statement.Resource) ? statement.Resource : [statement.Resource];
            const objectArnPrefix = `arn:aws:s3:::${bucketName}/`;

            for (const resource of resources) {
                if (!resource.startsWith(objectArnPrefix)) continue;
                
                const key = resource.substring(objectArnPrefix.length);
                
                // Handle wildcard patterns
                if (key === '*') {
                    // All objects are public - this is handled by checking if wildcard exists
                    // We'll return an empty Set to indicate "check individually" or we could
                    // fetch all objects. For now, we'll skip and let the UI handle this case.
                    continue;
                }
                
                // Handle paths ending with /* (e.g., folder/*)
                if (key.endsWith('/*')) {
                    const folderPrefix = key.slice(0, -2);
                    // This folder is public - we'll add the prefix as a marker
                    // The UI can check if object starts with this prefix
                    publicKeys.add(`${folderPrefix}/*`);
                    continue;
                }
                
                // Exact object key
                if (key) {
                    publicKeys.add(key);
                }
            }
        }

        return publicKeys;
    } catch (error) {
        // NoSuchBucketPolicy means no policy exists, so no public objects
        if ((error as { name?: string }).name === 'NoSuchBucketPolicy') {
            return new Set();
        }
        const sanitizedError = error instanceof S3ServiceError ? error : new S3ServiceError('getPublicObjects', error);
        console.error(sanitizedError);
        throw sanitizedError;
    }
};

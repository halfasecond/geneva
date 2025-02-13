import { Schema, Connection, Model } from 'mongoose';

interface CMS {
    slug: string;
    title: string;
    thumbnail?: Record<string, any>;
    content?: any[];
    tags?: string[];
    contentType?: string;
    published?: boolean;
    publishedDate?: Date;
    author?: string;
}

const schema = new Schema<CMS>({
    slug: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    thumbnail: {
        type: Object
    },
    content: {
        type: [Schema.Types.Mixed]
    },
    tags: [String],
    contentType: {
        type: String
    },
    published: {
        type: Boolean,
        default: false
    },
    publishedDate: {
        type: Date,
        default: Date.now
    },
    author: {
        type: String
    }
}, {
    timestamps: true
});

export default (prefix: string, db: Connection): Model<CMS> => {
    const modelName = `${prefix}_cms`;
    return db.model<CMS>(modelName, schema);
};

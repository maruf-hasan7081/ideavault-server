import { MongoClient } from "mongodb";
let client; let db;
export async function connectDB(){if(db)return db;if(!process.env.MONGODB_URI)throw new Error('MONGODB_URI is missing');client=new MongoClient(process.env.MONGODB_URI);await client.connect();db=client.db(process.env.DB_NAME||'ideavault');await Promise.all([
 db.collection('users').createIndex({email:1},{unique:true}),
 db.collection('ideas').createIndex({creatorEmail:1,createdAt:-1}),
 db.collection('ideas').createIndex({title:1}),
 db.collection('comments').createIndex({ideaId:1,createdAt:-1}),
 db.collection('comments').createIndex({userEmail:1,createdAt:-1}),
 db.collection('bookmarks').createIndex({userEmail:1,ideaId:1},{unique:true})
]);return db}

import { ObjectId } from "mongodb";
export function oid(value){if(!ObjectId.isValid(value))return null;return new ObjectId(value)}
export function cleanIdea(body){const required=['title','shortDescription','detailedDescription','category','imageURL','targetAudience','problemStatement','proposedSolution'];for(const k of required){if(!String(body[k]??'').trim())throw new Error(`${k} is required`)}return {
 title:String(body.title).trim(),shortDescription:String(body.shortDescription).trim(),detailedDescription:String(body.detailedDescription).trim(),category:String(body.category).trim(),tags:Array.isArray(body.tags)?body.tags.map(String).map(x=>x.trim()).filter(Boolean).slice(0,12):[],imageURL:String(body.imageURL).trim(),estimatedBudget:String(body.estimatedBudget||'').trim(),targetAudience:String(body.targetAudience).trim(),problemStatement:String(body.problemStatement).trim(),proposedSolution:String(body.proposedSolution).trim()
}}
export function escapeRegex(value=''){return value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}

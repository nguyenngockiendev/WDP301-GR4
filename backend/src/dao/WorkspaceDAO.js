import * as models from '../entities/index.js';
export class WorkspaceDAO {
 find(name, filter, page=1) { return models[name].find(filter).sort({createdAt:-1}).skip((page-1)*15).limit(15).lean(); }
 count(name, filter) { return models[name].countDocuments(filter); }
 ids(name, filter) { return models[name].distinct('_id',filter); }
 sum(name, filter, field) { return models[name].aggregate([{$match:filter},{$group:{_id:null,value:{$sum:'$'+field}}}]).then(rows=>rows[0]?.value||0); }
}

import { getProfile } from '../../domain/store.js';
import { analyzeRequirements } from '../../domain/requirements/index.js';
import { buildTailoredDraft } from '../../domain/tailoring/builder.js';
import { exportDocument } from '../../exporters/index.js';
import { validateExportRequest } from '../../schemas/export-request.js';
import { readJson } from '../router.js';
export const exportRoutes = [['POST /api/export',async({req,res})=>{const request=await readJson(req);const errors=validateExportRequest(request);if(errors.length)throw Object.assign(new Error('Invalid export request'),{name:'ValidationError',details:errors});const profile=getProfile();const analysis=analyzeRequirements(profile,request.description||'');const draft=buildTailoredDraft(profile,analysis);const body=exportDocument(request.format,profile,draft,analysis);const ext=request.format==='markdown'?'md':request.format==='json'?'json':request.format==='audit'?'json':'txt';res.writeHead(200,{'content-type':request.format==='markdown'||request.format==='text'?'text/plain; charset=utf-8':'application/json; charset=utf-8','content-disposition':`attachment; filename="grounded-career.${ext}"`,'x-content-type-options':'nosniff','cache-control':'no-store'});res.end(body);}]];

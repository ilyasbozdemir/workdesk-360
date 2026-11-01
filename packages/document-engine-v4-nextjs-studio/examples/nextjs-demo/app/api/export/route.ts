import {NextRequest,NextResponse} from 'next/server';
import {studio} from '../../../lib/studio';
export const runtime='nodejs';
export async function GET(request:NextRequest){const p=request.nextUrl.searchParams;const doc=p.get('doc'),tpl=p.get('tpl'),rev=Number(p.get('rev'));if(!doc||!tpl||!Number.isSafeInteger(rev)||rev<1)return NextResponse.json({error:'Geçersiz istek'},{status:400});const snapshot=studio().repo.history(doc,tpl).find(x=>x.revision===rev);if(!snapshot)return NextResponse.json({error:'Bulunamadı'},{status:404});return new NextResponse(JSON.stringify(snapshot,null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Content-Disposition':`attachment; filename="snapshot-${rev}.json"`}});}

// import { NextResponse } from "next/server";

// export async function optionsHandler() {
//   return new Response(null, {
//     status: 204,
//     headers: {
//       'Access-Control-Allow-Origin': '*',
//       'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
//       'Access-Control-Allow-Headers': 'Content-Type, Authorization'
//     }
//   });
// }

// export const headers = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
//   'Access-Control-Allow-Headers': 'Content-Type, Authorization'
// };

// export const headerOrigin = {
//   'Access-Control-Allow-Origin': '*'
// };

// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
//   'Access-Control-Allow-Headers': 'Content-Type, Authorization',
// };


// export async function OPTIONS() {
//   return new NextResponse(null, { status: 204, headers: corsHeaders });
// }

// export function withCors(response: NextResponse) {
//   response.headers.set('Access-Control-Allow-Origin', '*');
//   return response;
// }
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}
/* Shared between the browser (src/lib/admin.js) and the serverless function
   (api/save-content.js), so this file must stay free of browser-only APIs
   (no window/crypto.subtle/localStorage) and Node-only APIs (no require()).

   To change the credentials, run:
     node -e "const c=require('crypto');console.log(c.createHash('sha256').update('NEW_ID:NEW_PASSWORD').digest('hex'))"
   and replace the value below with the output. */
export const ADMIN_HASH =
  '409bf2bfee78c822ed5acfe9c4557334f0ce744daef0bf01c1d847fc06cfc1f1'

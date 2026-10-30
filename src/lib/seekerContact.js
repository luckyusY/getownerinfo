/**
 * The seeker's contact details, shaped for a viewer who is entitled to them.
 *
 * Lives here rather than in the route handler because three callers now need
 * the same shape: the detail API, the unlock API, and the request page, which
 * renders on the server. The unlock route used to reach it with
 * `import { buildSeekerContact } from "../route"`, which pulls a whole route
 * module in for one function.
 *
 * The watermark is stamped on every reveal so a leaked screenshot points back
 * at the account that paid for it.
 */
export function buildSeekerContact(request, watermark) {
  return {
    watermark,
    contact: {
      name: request.contact?.name,
      phone: request.contact?.phone,
      preferredContactTime: request.contact?.preferredContactTime,
    },
  };
}

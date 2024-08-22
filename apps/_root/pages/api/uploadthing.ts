import { createRouteHandler } from 'uploadthing/next-legacy'

import { ourFileRouter } from '@dozer/api'

const handler = createRouteHandler({
  router: ourFileRouter,
})

export default handler

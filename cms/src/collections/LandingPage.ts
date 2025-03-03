import type { GlobalConfig } from 'payload'

export const LandingPage: GlobalConfig = {
  custom: {
    url: ""
  },
  slug: 'landing',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
  versions: {
    drafts: true
  }
}

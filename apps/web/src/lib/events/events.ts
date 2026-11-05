export const eventLink = (event: { id: string; slug?: string | null }) =>
  event.slug ? `/events/${event.slug}` : `/events/id/${event.id}`;

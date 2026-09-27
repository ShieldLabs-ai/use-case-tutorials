// The events on sale. Made up for the demo.
export const EVENTS = [
  { id: 1, name: 'Harbor Lights Jazz Night', date: 'Fri, Oct 16', venue: 'Pier 9 Hall', price: 48 },
  { id: 2, name: 'Northfield Indie Showcase', date: 'Sat, Oct 24', venue: 'The Old Mill', price: 35 },
  { id: 3, name: 'Symphony Under the Stars', date: 'Sun, Nov 1', venue: 'Riverside Amphitheater', price: 62 },
  { id: 4, name: 'Late Laughs Comedy Hour', date: 'Thu, Nov 5', venue: 'Basement Stage', price: 22 },
  { id: 5, name: 'Winter Folk Festival', date: 'Sat, Dec 12', venue: 'Grange Hall', price: 55 },
];

export function findEvent(id) {
  return EVENTS.find((event) => event.id === Number(id));
}

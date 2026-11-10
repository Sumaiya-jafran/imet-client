// Status reference retained only for historical purchase records.
export type RfqStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ROUTED'
  | 'QUOTED'
  | 'ACCEPTED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'DECLINED';

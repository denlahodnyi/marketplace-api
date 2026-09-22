import { PrimaryColumn } from 'typeorm';

type InstanceWithPrimaryKey<T extends string> = {
  [key in T]: string;
};
interface UUIDv7PrimaryEntity<T extends string> {
  new (): InstanceWithPrimaryKey<T>;
}

/**
 * Create entity with UUIDv7 primary column
 */
export function primaryAsUuidEntityFactory<T extends string>(
  columnName: T,
  dbColumnName?: string,
) {
  class UUIDv7Primary {
    @PrimaryColumn({
      name: dbColumnName,
      type: 'uuid',
      default: () => 'uuidv7()',
    })
    [columnName]: string;
  }
  return UUIDv7Primary as UUIDv7PrimaryEntity<T>;
}

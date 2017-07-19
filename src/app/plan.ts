export class Plan {
   expenditure: number;
   materials: Object;
   prices: Object;

    constructor( values: Object = {} ) {
		Object.assign( this, values );
	}
}

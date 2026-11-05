import assert from 'node:assert/strict';
import { test } from 'node:test';
import { supplierSchema } from '../src/lib/schema-validations/supplier.schema.ts';
const profile = {companyName:'Supplier',type:'LOCAL',description:'Equipment supplier',contactName:'Owner',businessEmail:'owner@example.test',businessPhone:'123',address:'Street',city:'Dhaka',country:'Bangladesh',registrationNumber:null,website:null,logoUrl:null,documents:[]};
test('supplier forms support generated or explicit slugs and reject unsafe or ambiguous slugs',()=>{
 assert.equal(supplierSchema.parse({...profile,slug:''}).slug,undefined);
 assert.equal(supplierSchema.parse(profile).slug,undefined);
 assert.equal(supplierSchema.parse({...profile,slug:'independent-machines'}).slug,'independent-machines');
 for(const slug of ['../admin','Bad Name','two--hyphens','11111111-1111-4111-8111-111111111111'])assert.equal(supplierSchema.safeParse({...profile,slug}).success,false);
});

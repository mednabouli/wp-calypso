/** @format */

/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { ZONINATOR_ADD_ZONE, ZONINATOR_DELETE_ZONE, ZONINATOR_REQUEST_ERROR, ZONINATOR_REQUEST_ZONES, ZONINATOR_SAVE_ZONE, ZONINATOR_UPDATE_ZONE, ZONINATOR_UPDATE_ZONES } from '../../action-types';
import { requestZones, requestError, updateZones, updateZone, addZone, deleteZone, saveZone } from '../actions';

describe( 'actions', () => {
	const siteId = 123456;
	const zones = {
		1: {
			id: 1,
			name: 'Foo',
			description: 'A test zone.',
		},
		2: {
			id: 2,
			name: 'Bar',
			description: 'Another zone.',
		},
	};

	describe( '#updateZones()', () => {
		it( 'should return an action object', () => {
			const action = updateZones( siteId, zones );

			expect( action ).to.deep.equal( {
				type: ZONINATOR_UPDATE_ZONES,
				data: zones,
				siteId,
			} );
		} );
	} );

	describe( '#requestZones()', () => {
		it( 'should return an action object', () => {
			const action = requestZones( siteId );

			expect( action ).to.deep.equal( {
				type: ZONINATOR_REQUEST_ZONES,
				siteId,
			} );
		} );
	} );

	describe( '#requestError()', () => {
		it( 'should return an action object', () => {
			const action = requestError( siteId );

			expect( action ).to.deep.equal( {
				type: ZONINATOR_REQUEST_ERROR,
				siteId,
			} );
		} );
	} );

	describe( '#updateZone()', () => {
		it( 'should return an action object', () => {
			const action = updateZone( siteId, 1, zones[ 1 ] );

			expect( action ).to.deep.equal( {
				type: ZONINATOR_UPDATE_ZONE,
				data: zones[ 1 ],
				zoneId: 1,
				siteId,
			} );
		} );
	} );

	describe( '#addZone()', () => {
		it( 'should return an action object', () => {
			const action = addZone( siteId, 'form', zones[ 1 ] );

			expect( action ).to.deep.equal( {
				type: ZONINATOR_ADD_ZONE,
				data: zones[ 1 ],
				form: 'form',
				siteId,
			} );
		} );
	} );

	describe( '#saveZone', () => {
		it( 'should return an action object', () => {
			const action = saveZone( siteId, zones[ 1 ].id, 'form', zones[ 1 ] );

			expect( action ).to.deep.equal( {
				type: ZONINATOR_SAVE_ZONE,
				data: zones[ 1 ],
				form: 'form',
				zoneId: 1,
				siteId,
			} );
		} );
	} );

	describe( '#deleteZone', () => {
		it( 'should return an action object', () => {
			const action = deleteZone( siteId, zones[ 1 ].id );

			expect( action ).to.deep.equal( {
				type: ZONINATOR_DELETE_ZONE,
				zoneId: 1,
				siteId,
			} );
		} );
	} );
} );

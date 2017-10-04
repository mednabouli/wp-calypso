/** @format */
/**
 * External dependencies
 */
import { expect } from 'chai';
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import isSiteOnFreePlan from '../is-site-on-free-plan';
import { PLAN_BUSINESS, PLAN_FREE } from 'lib/plans/constants';
import { getCurrentPlan } from 'state/sites/plans/selectors';
jest.mock( 'state/sites/plans/selectors', () => ( { getCurrentPlan: require( 'sinon' ).stub() } ) );

describe( 'isSiteOnFreePlan', () => {
	const state = deepFreeze( {} );

	it( 'should return false when plan is not known', () => {
		getCurrentPlan.returns( null );
		expect( isSiteOnFreePlan( state, 'site1' ) ).to.be.false;
	} );

	it( 'should return false when not on free plan', () => {
		getCurrentPlan.returns( { productSlug: PLAN_BUSINESS } );
		expect( isSiteOnFreePlan( state, 'site1' ) ).to.be.false;
	} );

	it( 'should return true when on free plan', () => {
		getCurrentPlan.returns( { productSlug: PLAN_FREE } );
		expect( isSiteOnFreePlan( state, 'site1' ) ).to.be.true;
	} );
} );

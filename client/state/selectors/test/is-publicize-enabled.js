/**
 * External dependencies
 *
 * @format
 */

import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { isPublicizeEnabled } from '../';

describe( 'isPublicizeEnabled()', () => {
	const siteId = 2916284;
	const postType = 'post';

	it( 'should return false when Publicize is permanently disabled', () => {
		const result = isPublicizeEnabled(
			{
				sites: {
					items: {
						[ siteId ]: {
							ID: siteId,
							options: {
								publicize_permanently_disabled: true,
							},
						},
					},
				},
			},
			siteId,
			postType
		);

		expect( result ).to.be.false;
	} );

	it( 'should return false for jetpack site with Publicize disabled', () => {
		const result = isPublicizeEnabled(
			{
				sites: {
					items: {
						[ siteId ]: {
							ID: siteId,
							jetpack: true,
							options: {
								active_modules: [],
							},
						},
					},
				},
			},
			siteId,
			postType
		);

		expect( result ).to.be.false;
	} );

	it( 'should return true for jetpack site with Publicize enabled', () => {
		const result = isPublicizeEnabled(
			{
				sites: {
					items: {
						[ siteId ]: {
							ID: siteId,
							jetpack: true,
							options: {
								active_modules: [ 'publicize' ],
							},
						},
					},
				},
			},
			siteId,
			postType
		);

		expect( result ).to.be.true;
	} );

	it( 'should return true for regular site and post type', () => {
		const result = isPublicizeEnabled(
			{
				sites: {
					items: {
						[ siteId ]: {
							ID: siteId,
						},
					},
				},
			},
			siteId,
			postType
		);

		expect( result ).to.be.true;
	} );
} );

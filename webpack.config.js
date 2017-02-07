/***** WARNING: ES5 code only here. Not transpiled! *****/
/* eslint-disable no-var */

/**
 * External dependencies
 */
const webpack = require( 'webpack' ),
	path = require( 'path' );

/**
 * Internal dependencies
 */
const config = require( './server/config' ),
	sections = require( './client/sections' ),
	cacheIdentifier = require( './server/bundler/babel/babel-loader-cache-identifier' ),
	ChunkFileNamePlugin = require( './server/bundler/plugin' ),
	CopyWebpackPlugin = require( 'copy-webpack-plugin' ),
	HardSourceWebpackPlugin = require( 'hard-source-webpack-plugin' );

/**
 * Internal variables
 */
const CALYPSO_ENV = process.env.CALYPSO_ENV || 'development';

const bundleEnv = config( 'env' );
const sectionCount = sections.length;

const webpackConfig = {
	bail: CALYPSO_ENV !== 'development',
	cache: true,
	entry: {},
	devtool: '#eval',
	output: {
		path: path.join( __dirname, 'public' ),
		publicPath: '/calypso/',
		filename: '[name].[chunkhash].js', // prefer the chunkhash, which depends on the chunk, not the entire build
		chunkFilename: '[name].[chunkhash].js', // ditto
		devtoolModuleFilenameTemplate: 'app:///[resource-path]'
	},
	module: {
		// avoids this warning:
		// https://github.com/localForage/localForage/issues/577
		noParse: /[\/\\]node_modules[\/\\]localforage[\/\\]dist[\/\\]localforage\.js$/,
		loaders: [
			{
				test: /sections.js$/,
				exclude: 'node_modules',
				loader: path.join( __dirname, 'server', 'bundler', 'loader' )
			},
			{
				test: /\.json$/,
				loader: 'json-loader'
			},
			{
				test: /\.html$/,
				loader: 'html-loader'
			},
			{
				include: require.resolve( 'tinymce/tinymce' ),
				loader: 'exports?window.tinymce',
			},
			{
				include: /node_modules\/tinymce/,
				loader: 'imports?this=>window',
			}
		]
	},
	resolve: {
		extensions: [ '', '.json', '.js', '.jsx' ],
		root: [ path.join( __dirname, 'client' ), path.join( __dirname, 'client', 'extensions' ) ],
		modulesDirectories: [ 'node_modules' ],
		alias: {
			'react-virtualized': 'react-virtualized/dist/commonjs',
			'social-logos/example': 'social-logos/build/example'
		}
	},
	resolveLoader: {
		root: [ __dirname ]
	},
	node: {
		console: false,
		process: true,
		global: true,
		Buffer: true,
		__filename: 'mock',
		__dirname: 'mock',
		fs: 'empty'
	},
	plugins: [
		new webpack.DefinePlugin( {
			'process.env': {
				NODE_ENV: JSON.stringify( bundleEnv )
			}
		} ),
		new webpack.optimize.OccurenceOrderPlugin( true ),
		new webpack.IgnorePlugin( /^props$/ ),
		new CopyWebpackPlugin( [ { from: 'node_modules/flag-icon-css/flags/4x3', to: 'images/flags' } ] )
	],
	externals: [ 'electron' ]
};

if ( CALYPSO_ENV === 'desktop' ) {
	// no chunks or dll here, just one big file for the desktop app
	webpackConfig.output.filename = '[name].js';
} else {
	webpackConfig.plugins.push(
		new webpack.DllReferencePlugin( {
			context: path.join( __dirname, 'client' ),
			manifest: require( './build/dll/vendor.' + bundleEnv + '-manifest.json' )
		} )
	);

	// slight black magic here. 'manifest' is a secret webpack module that includes the webpack loader and
	// the mapping from module id to path.
	//
	// We extract it to prevent build-$env chunk from changing when the contents of a child chunk change.
	//
	// See https://github.com/webpack/webpack/issues/1315 for some backgroud. Guidance here taken from
	// https://github.com/webpack/webpack/issues/1315#issuecomment-158530525.
	//
	// Our hashes will still change when modules are added or removed, but many of our deploys don't
	// involve module structure changes, so this should at least help in many cases.
	webpackConfig.plugins.push(
		new webpack.optimize.CommonsChunkPlugin( {
			name: 'manifest',
			// have to use [hash] here instead of [chunkhash] because this is an entry chunk
			filename: 'manifest.[hash].js'
		} )
	);

	// walk each group and make a commons chunk for it
	const groups = sections.reduce( function( groups, section ) {
		if ( ! section.group ) {
			return groups;
		}
		const modulesForGroup = groups.get( section.group ) || new Set();
		modulesForGroup.add( section.module );
		groups.set( section.group, modulesForGroup );
		return groups;
	}, new Map() );

	groups.forEach( function( modules, group ) {
		const mods = Array.from( modules );
		console.log( 'building commons for ' + group + ': ' + mods );
		if ( group && modules.size >= 2 ) {
			const filename = group + '-commons.[chunkhash].js'
			console.log( filename );
			webpackConfig.plugins.push( new webpack.optimize.CommonsChunkPlugin( {
				//filename: filename,
				chunks: mods,
				minChunks: 2,
				async: true,
				children: true
			} ) );
		}
	} );

	// Somewhat badly named, this is our custom chunk loader that knows about sections
	// and our loading notification infrastructure
	webpackConfig.plugins.push( new ChunkFileNamePlugin() );

	// jquery is only needed in the build for the desktop app
	// see electron bug: https://github.com/atom/electron/issues/254
	webpackConfig.externals.push( 'jquery' );
}

const jsLoader = {
	test: /\.jsx?$/,
	exclude: /node_modules/,
	loader: 'babel',
	query: {
		cacheDirectory: './.babel-cache',
		cacheIdentifier: cacheIdentifier,
		plugins: [ [
			path.join( __dirname, 'server', 'bundler', 'babel', 'babel-plugin-transform-wpcalypso-async' ),
			{ async: config.isEnabled( 'code-splitting' ) }
		] ]
	}
};

if ( CALYPSO_ENV === 'development' ) {
	const DashboardPlugin = require( 'webpack-dashboard/plugin' );
	webpackConfig.plugins.splice( 0, 0, new DashboardPlugin() );
	webpackConfig.plugins.push( new webpack.HotModuleReplacementPlugin() );
	webpackConfig.entry[ 'build-' + CALYPSO_ENV ] = [
		'webpack-dev-server/client?/',
		'webpack/hot/only-dev-server',
		path.join( __dirname, 'client', 'boot' )
	];

	if ( config.isEnabled( 'use-source-maps' ) ) {
		webpackConfig.debug = true;
		webpackConfig.devtool = '#eval-cheap-module-source-map';
		webpackConfig.module.preLoaders = webpackConfig.module.preLoaders || [];
		webpackConfig.module.preLoaders.push( {
			test: /\.jsx?$/,
			loader: 'source-map-loader'
		} );
	} else {
		// Add react hot loader before babel-loader.
		// It's loaded by default since `use-source-maps` is disabled by default.
		jsLoader.loaders = [ 'react-hot' ].concat( jsLoader.loaders );
	}
} else {
	webpackConfig.entry[ 'build-' + CALYPSO_ENV ] = path.join( __dirname, 'client', 'boot' );
	webpackConfig.debug = false;
	webpackConfig.devtool = false;
}

if ( CALYPSO_ENV === 'production' ) {
	webpackConfig.plugins.push( new webpack.NormalModuleReplacementPlugin(
		/^debug$/,
		path.join( __dirname, 'client', 'lib', 'debug-noop' )
	) );
}

if ( config.isEnabled( 'webpack/persistent-caching' ) ) {
	webpackConfig.recordsPath = path.join( __dirname, '.webpack-cache', 'client-records.json' );
	webpackConfig.plugins.unshift( new HardSourceWebpackPlugin( { cacheDirectory: path.join( __dirname, '.webpack-cache', 'client' ) } ) );
}

webpackConfig.module.loaders = [ jsLoader ].concat( webpackConfig.module.loaders );

module.exports = webpackConfig;

/* eslint-enable no-var */

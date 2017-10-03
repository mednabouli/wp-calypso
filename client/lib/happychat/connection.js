/**
 * External dependencies
 */
import IO from 'socket.io-client';
import { v4 as uuid } from 'uuid';

/**
 * Internal dependencies
 */
import {
	HAPPYCHAT_MESSAGE_TYPES
} from 'state/happychat/constants';
import {
	receiveChatEvent,
	requestChatTranscript,
	setConnected,
	setConnecting,
	setDisconnected,
	setHappychatAvailable,
	setHappychatChatStatus,
	setReconnecting,
} from 'state/happychat/actions';

const debug = require( 'debug' )( 'calypso:happychat:connection' );

const isString = ( socket ) => ( typeof socket === 'string' || socket instanceof String );
const buildConnection = ( socket ) => isString( socket )
	? new IO( socket ) // If socket is an URL, connect to server.
	: socket; // If socket is not an url, use it directly. Useful for testing.

class Connection {

	init( url, dispatch, auth ) {
		dispatch( setConnecting() );
		return auth()
			.then( ( user ) => this.open( buildConnection( url ), dispatch, user ) )
			.catch( ( e ) => debug( 'failed to start happychat session', e, e.stack ) );
	}

	open( socket, dispatch, { signer_user_id, jwt, locale, groups, geo_location } ) {
		if ( ! this.openSocket ) {
			this.openSocket = new Promise( resolve => {
				// TODO: reject this promise
				socket
					.once( 'connect', () => {} )
					.on( 'token', handler => handler( { signer_user_id, jwt, locale, groups } ) )
					.on( 'init', () => {
						dispatch( setConnected( { signer_user_id, locale, groups, geo_location } ) );
						dispatch( requestChatTranscript() );
						resolve( socket );
					} )
					.on( 'unauthorized', () => socket.close() )
					.on( 'disconnect', reason => dispatch( setDisconnected( reason ) ) )
					.on( 'reconnecting', () => dispatch( setReconnecting() ) )
					.on( 'status', status => dispatch( setHappychatChatStatus( status ) ) )
					.on( 'accept', accept => dispatch( setHappychatAvailable( accept ) ) )
					.on( 'message', message => dispatch( receiveChatEvent( message ) ) );
			} );
		} else {
			debug( 'socket already initialized' );
		}
		return this.openSocket;
	}

	typing( message ) {
		this.openSocket
		.then(
			socket => socket.emit( 'typing', { message } ),
			e => debug( 'failed to send typing', e )
		);
	}

	notTyping() {
		this.openSocket
		.then(
			socket => socket.emit( 'typing', false ),
			e => debug( 'failed to send typing', e )
		);
	}

	send( message ) {
		this.openSocket.then(
			socket => socket.emit( 'message', { text: message, id: uuid() } ),
			e => debug( 'failed to send message', e )
		);
	}

	sendEvent( message ) {
		this.openSocket.then(
			socket => socket.emit( 'message', {
				text: message,
				id: uuid(),
				type: HAPPYCHAT_MESSAGE_TYPES.CUSTOMER_EVENT,
				meta: { forOperator: true, event_type: HAPPYCHAT_MESSAGE_TYPES.CUSTOMER_EVENT }
			} ),
			e => debug( 'failed to send message', e )
		);
	}

	/**
	 * Update chat preferences (locale and groups)
	 * @param {string} locale representing the user selected locale
	 * @param {array} groups of string happychat groups (wp.com, jpop) based on the site selected
	 */
	setPreferences( locale, groups ) {
		this.openSocket.then(
			socket => socket.emit( 'preferences', { locale, groups } ),
			e => debug( 'failed to send preferences', e )
		);
	}

	sendLog( message ) {
		this.openSocket.then(
			socket => socket.emit( 'message', {
				text: message,
				id: uuid(),
				type: HAPPYCHAT_MESSAGE_TYPES.LOG,
				meta: { forOperator: true, event_type: HAPPYCHAT_MESSAGE_TYPES.LOG }
			} ),
			e => debug( 'failed to send message', e )
		);
	}

	/**
	 * Send customer and browser information
	 * @param { Object } info selected form fields, customer date time, user agent and browser info
	 */
	sendInfo( info ) {
		this.openSocket.then(
			socket => socket.emit( 'message', {
				id: uuid(),
				meta: { ...info, forOperator: true },
				type: HAPPYCHAT_MESSAGE_TYPES.CUSTOMER_INFO,
			} ),
			e => debug( 'failed to send message', e )
		);
	}

	transcript( timestamp ) {
		return this.openSocket.then( socket => Promise.race( [
			new Promise( ( resolve, reject ) => {
				socket.emit( 'transcript', timestamp || null, ( e, result ) => {
					if ( e ) {
						return reject( new Error( e ) );
					}
					resolve( result );
				} );
			} ),
			new Promise( ( resolve, reject ) => setTimeout( () => {
				reject( Error( 'timeout' ) );
			}, 10000 ) )
		] ) );
	}

}

export default ( ) => new Connection( );

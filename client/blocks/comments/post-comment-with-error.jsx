/** @format */
/**
 * External dependencies
 */
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

/***
 * Internal dependencies
 */
import PostCommentForm from './form';

export default class PostCommentWithError extends React.Component {
	renderCommentForm() {
		const { post, commentsTree, commentId, onUpdateCommentText, activeReplyCommentId } = this.props;
		const commentText = get( commentsTree, [ commentId, 'data', 'content' ] );
		const commentParentId = get( commentsTree, [ commentId, 'data', 'parent', 'ID' ] );
		const placeholderError = get( commentsTree, [ commentId, 'data', 'placeholderError' ] );

		if ( activeReplyCommentId !== commentParentId ) {
			return null;
		}

		return (
			<PostCommentForm
				ref="postCommentForm"
				post={ post }
				parentCommentId={ commentParentId }
				commentText={ commentText }
				onUpdateCommentText={ onUpdateCommentText }
				placeholderId={ commentId }
				error={ placeholderError }
			/>
		);
	}

	render() {
		return (
			<li className="comments__comment is-error">
				{ this.renderCommentForm() }
				{ this.props.repliesList }
			</li>
		);
	}
}

PostCommentWithError.propTypes = {
	post: PropTypes.object.isRequired,
	repliesList: PropTypes.object,
	commentsTree: PropTypes.object,
	onUpdateCommentText: PropTypes.func.isRequired,
	commentId: PropTypes.oneOfType( [ PropTypes.string, PropTypes.number ] ).isRequired,
};

import React, { forwardRef, useImperativeHandle } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

// Styled component for the Post
const StyledPost = styled.div`
  position: absolute;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  border-radius: 50%; /* Make it cylindrical/circular from top view */
  background-color: #666; /* Grey metal color */
  border: 2px solid #444;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  z-index: 400; /* Below ball and flippers, above playfield */
  
  /* Positioning based on props */
  top: ${props => props.top}px;
  left: ${props => props.left}px;
`;

/**
 * Post Component
 *
 * Represents a simple, static cylindrical post on the pinball playfield.
 * It acts as a fixed barrier or rebound point for the ball.
 *
 * @param {object} props - Component props
 * @param {string} props.id - Unique identifier for the post.
 * @param {number} props.top - The top position of the post's center.
 * @param {number} props.left - The left position of the post's center.
 * @param {number} [props.size=15] - The diameter of the cylindrical post.
 * @param {React.Ref} ref - Ref for accessing DOM element or imperative handles.
 */
const Post = forwardRef(({
  id,
  top,
  left,
  size = 15,
}, ref) => {
  useImperativeHandle(ref, () => ({
    getBoundingClientRect: () => {
      // Return a bounding box for collision detection.
      // This is a simple circular post, so a square bounding box is sufficient.
      return {
        left: left,
        top: top,
        right: left + size,
        bottom: top + size,
        width: size,
        height: size,
        x: left,
        y: top,
      };
    },
    // No specific handleCollision or other interactive methods needed for a simple static post,
    // as its primary function is to define a barrier. Physics engine in Pinball.js
    // will handle the ball's interaction (bounce) with this static shape.
  }));

  return (
    <StyledPost
      ref={ref}
      id={id}
      top={top}
      left={left}
      size={size}
    />
  );
});

// PropTypes for type checking and documentation
Post.propTypes = {
  id: PropTypes.string.isRequired,
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  size: PropTypes.number,
};

// Set a display name for easier debugging in React DevTools
Post.displayName = 'Post';

export default Post;

const React = require('react');

class CustomComponent extends React.Component {
  render() {
    const { idyll, hasError, updateProps, children, ...props } = this.props;
    return (
      <small style={{textTransform: 'uppercase'}}>
        <b style={{color: 'red'}}>[Matt note]</b>: {children}
      </small>
    );
  }
}

module.exports = CustomComponent;

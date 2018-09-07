const React = require('react');

class Conditional extends React.Component {
  render() {
    const { idyll, hasError, updateProps, ...props } = this.props;

    return <div className={'notification'} {...props}>{props.children}</div>;
  }
}

module.exports = Conditional;

import React from 'react';

const { isMobile } = require('../utils');

class TextContainer extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      margin: '0 0 0 100px'
    }
  }

  componentDidMount() {
    if (isMobile()) {
      this.setState({margin: '0'});
    }
  }
  render() {
    const { idyll, children, className, hasError, updateProps, ...props } = this.props;
    const { styles, ...layout } = idyll.layout;
    const { styles: _, ...theme } = idyll.theme;
    const style = { ...layout, ...theme, margin: this.state.margin};
    const cn = (className || '') + ' idyll-text-container';
    return (
      <div style={style} {...props} className={cn}>{children}</div>
    );
  }
}

export default TextContainer;

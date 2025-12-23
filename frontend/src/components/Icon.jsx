import React from 'react';

const prefixMap = {
  solid: 'fa-solid',
  regular: 'fa-regular',
  brands: 'fa-brands',
};

const Icon = ({
  name,
  variant = 'solid',
  size = 16,
  className = '',
  style,
  title,
  ...rest
}) => {
  const prefix = prefixMap[variant] || prefixMap.solid;
  const mergedStyle = {
    fontSize: size,
    lineHeight: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...style,
  };

  const ariaProps = rest['aria-label'] ? {} : { 'aria-hidden': true };

  return (
    <i
      className={`${prefix} fa-${name} ${className}`.trim()}
      style={mergedStyle}
      title={title}
      {...ariaProps}
      {...rest}
    />
  );
};

export default Icon;

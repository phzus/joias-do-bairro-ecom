
import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`flex items-center select-none ${className ?? ''}`}>
      <img src="/logo-joias.svg" alt="Joias do Bairro" className="h-9 md:h-10 w-auto object-contain" />
    </div>
  );
};

export default Logo;

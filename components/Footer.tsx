import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-4 mt-4">
      <div className="container mx-auto text-center text-sm">
        <p>
          &copy; {new Date().getFullYear()} BUSONTIME. Desenvolvido por{' '}
          <a
            href="https://github.com/N41LL1W"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline"
          >
            Willian Batista
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;

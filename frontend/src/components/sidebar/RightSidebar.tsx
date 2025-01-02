import React from 'react';

const RightSidebar = () => {
  return (
    <div className="w-64 bg-gray-100 dark:bg-gray-800 h-screen p-4">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
          Online Kullanıcılar
        </h2>
        {/* Online kullanıcı listesi buraya gelecek */}
        <div className="space-y-2">
          {/* Örnek kullanıcılar */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-300">Kullanıcı 1</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
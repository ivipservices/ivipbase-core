# Componentes principais do iVipBase

Este pacote contém funcionalidades compartilhadas que são usadas por outros pacotes do iVipBase, não sendo necessário instalá-lo manualmente. Consulte [ivipbase](https://www.npmjs.com/package/ivipbase) e [ivipbase-server](https://www.npmjs.com/package/ivipbase-server) para obter mais informações.

## Pacotes ESM e CJS

Todos os pacotes do _iVipBase_ foram convertidos para TypeScript, permitindo que sejam transpilados para módulos ESM (ES Modules) e CommonJS. Isso significa que agora é seguro para o `ivipbase-core` (v0.5.0+) exportar sua versão `ESM` quando usado com uma declaração `import`. Se 1 ou mais pacotes _iVipBase_ (database, cliente, servidor, etc.) forem usados em um único projeto, eles usarão a mesma base de código _core_, evitando assim o chamado ["Dual package hazard"](https://nodejs.org/api/packages.html#packages_dual_package_hazard).

## Substituições de bundlers para navegadores

Para fornecer suporte a navegadores, alguns arquivos de origem possuem uma contrapartida específica para navegadores que anteriormente eram especificadas apenas no _package.json_ principal. Como agora existem várias distribuições, as substituições específicas para navegadores das distribuições foram adicionadas aos arquivos _package.json_ nos diretórios _dist/cjs_ e _dist/esm_: os bundlers como _Webpack_ e _Browserify_ usam esses arquivos em vez dos existentes no _package.json_ raiz. O _Vite_ (e o _Rollup_?) parecem usar apenas as substituições listadas no _package.json_ raiz, por isso ainda precisam ser mencionados lá também.
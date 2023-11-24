# My Chrome Extension

Esta es una extensión de Chromium diseñada para detectar el typosquatting en los dominios que el usuario visita.

## Uso

1. Instale la extensión en su navegador Chromium.
2. Haga clic en el ícono de la extensión en la barra de herramientas para abrir el popup.
3. En el popup, introduzca los dominios que desea revisar.
4. Navegue por la web como lo haría normalmente. Si visita un dominio que parece estar usando typosquatting, la extensión le alertará.

## Configuración

Puede configurar la extensión a través de la página de opciones. Para acceder a ella, haga clic con el botón derecho en el ícono de la extensión y seleccione "Opciones".

## Desarrollo

Esta extensión está desarrollada en JavaScript. Los archivos principales son:

- `src/background.js`: Revisa si se está usando typosquatting en los dominios visitados.
- `src/content.js`: Se inyecta en cada página web que el usuario visita.
- `src/popup.js`: Permite al usuario introducir dominios a revisar.
- `src/options.js`: Permite al usuario configurar la extensión.

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abra un issue o un pull request si desea contribuir.

## Licencia

Esta extensión está licenciada bajo la licencia MIT.
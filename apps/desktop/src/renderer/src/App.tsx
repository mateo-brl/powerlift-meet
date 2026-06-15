import { useEffect, useState } from 'react';
import { Control } from './views/Control.js';
import { Feuille } from './views/Feuille.js';
import { Joueur } from './views/Joueur.js';
import { Chargeur } from './views/Chargeur.js';
import { Ordre } from './views/Ordre.js';

type Route = 'control' | 'feuille' | 'joueur' | 'chargeur' | 'ordre';

function routeFromHash(): Route {
  const h = location.hash.replace(/^#\/?/, '');
  if (['feuille', 'joueur', 'chargeur', 'ordre'].includes(h)) return h as Route;
  return 'control';
}

export function App(): JSX.Element {
  const [route, setRoute] = useState<Route>(routeFromHash());
  useEffect(() => {
    const onHash = () => setRoute(routeFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  switch (route) {
    case 'feuille':
      return <Feuille />;
    case 'joueur':
      return <Joueur />;
    case 'chargeur':
      return <Chargeur />;
    case 'ordre':
      return <Ordre />;
    default:
      return <Control />;
  }
}

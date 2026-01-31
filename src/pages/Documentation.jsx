import React from 'react';
import { Book, CheckCircle2, ShoppingCart, Package, DollarSign, Wallet, BarChart3, User, Settings, Info, ArrowRight, Briefcase, ClipboardList } from 'lucide-react';

const DocumentationPage = () => {
  const sections = [
    {
      title: "Introduction",
      icon: <Info className="h-6 w-6 text-indigo-600" />,
      content: "KZRL Bar est une solution complète de gestion pour votre établissement. Elle permet de suivre les ventes, les stocks, les achats et les dépenses en temps réel.",
      items: [
        "Interface intuitive et réactive",
        "Gestion multi-utilisateurs avec rôles",
        "Suivi précis de la trésorerie"
      ]
    },
    {
      title: "Ventes (POS)",
      icon: <DollarSign className="h-6 w-6 text-green-600" />,
      content: "Le module de vente est conçu pour être rapide et efficace.",
      items: [
        "Saisie rapide des articles",
        "Calcul automatique du total",
        "Impression des tickets de caisse (si configuré)",
        "Suivi des ventes par session"
      ]
    },
    {
      title: "Gestion des Stocks",
      icon: <Package className="h-6 w-6 text-blue-600" />,
      content: "Suivez vos produits et évitez les ruptures de stock avec flexibilité.",
      items: [
        "Conditionnement flexible (Carton ou Unité)",
        "Conversion automatique Carton -> Bouteilles",
        "Gestion des catégories par magasin",
        "Alerte de stock bas et inventaire",
        "Historique des mouvements de stock"
      ]
    },
    {
      title: "Achats et Dépenses",
      icon: <ShoppingCart className="h-6 w-6 text-orange-600" />,
      content: "Maîtrisez vos flux financiers sortants.",
      items: [
        "Enregistrement des factures fournisseurs",
        "Suivi des dépenses de petit matériel",
        "Gestion des frais de fonctionnement",
        "Impact direct sur la balance de trésorerie"
      ]
    },
    {
      title: "Rapports et Analyses",
      icon: <BarChart3 className="h-6 w-6 text-purple-600" />,
      content: "Obtenez une vision claire de la santé financière de votre bar.",
      items: [
        "Rapports journaliers et mensuels",
        "Analyse des produits les plus vendus",
        "Calcul automatique de la marge",
        "Exportation des données pour la comptabilité"
      ]
    },
    {
      title: "Gestion Multi-Magasins",
      icon: <Briefcase className="h-6 w-6 text-indigo-600" />,
      content: "Gérez plusieurs points de vente avec une isolation totale des données.",
      items: [
        "Stocks et inventaires séparés par magasin",
        "Caisse et journal financier indépendants",
        "Catégories de produits spécifiques au bar",
        "Rapports de performance par établissement"
      ]
    },
    {
      title: "Inventaire Matériel",
      icon: <ClipboardList className="h-6 w-6 text-amber-600" />,
      content: "Suivez votre matériel fixe (mobilier, casiers, ustensiles) séparément du stock vendable.",
      items: [
        "Catégories spécifiques (Mobiliers, Verrerie...)",
        "Sessions d'inventaire avec état (Bon, Abîmé, Perdu)",
        "Historique complet des audits",
        "Mise à jour automatique des quantités après clôture"
      ]
    },
    {
      title: "Administration",
      icon: <Settings className="h-6 w-6 text-gray-600" />,
      content: "Configurez l'application selon vos besoins.",
      items: [
        "Gestion des utilisateurs et des permissions",
        "Configuration des magasins et affectations",
        "Sauvegarde et restauration des données",
        "Personnalisation de l'interface"
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-2xl mb-4">
          <Book className="h-8 w-8 text-indigo-600" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
          Documentation KZRL Bar
        </h1>
        <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">
          Apprenez à maîtriser tous les aspects de votre application de gestion de bar.
        </p>
      </div>

      {/* Grid of sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sections.map((section, index) => (
          <div
            key={index}
            className="group relative bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gray-50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                {section.icon}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
            </div>

            <p className="text-gray-600 mb-8 leading-relaxed">
              {section.content}
            </p>

            <ul className="space-y-3">
              {section.items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-500">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 pt-8 border-t border-gray-50 flex justify-end">
              <button className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                En savoir plus <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer/Help section */}
      <div className="mt-20 p-8 rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-700 text-white text-center shadow-2xl">
        <h3 className="text-2xl font-bold mb-4">Besoin d'aide supplémentaire ?</h3>
        <p className="text-indigo-100 mb-8 max-w-2xl mx-auto">
          Si vous ne trouvez pas la réponse à vos questions dans cette documentation, n'hésitez pas à contacter notre support technique ou à consulter les tutoriels vidéo.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg">
            Contacter le support
          </button>
          <button className="px-6 py-3 bg-indigo-500/30 text-white border border-indigo-400/50 rounded-xl font-bold hover:bg-indigo-500/40 transition-colors">
            Tutoriels Vidéo
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage;

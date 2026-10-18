/* Arborescence et tarifs repris du catalogue fourni dans la V9. */
window.BR_TREE = {
  "id": "root",
  "name": "Prestations",
  "children": [
    {
      "id": "onglerie",
      "name": "Onglerie",
      "children": [
        {
          "id": "gel",
          "name": "Prestations Gel",
          "children": [
            {
              "id": "gel-gainage",
              "name": "Gel sans rallongement",
              "dur": "1h30",
              "price": 52
            },
            {
              "id": "gel-chablon",
              "name": "Extension chablon",
              "dur": "2h00",
              "price": 60
            },
            {
              "id": "gel-premiere",
              "name": "Première pose sur ongles rongés",
              "dur": "1h15",
              "price": 55
            },
            {
              "id": "gel-remp-34",
              "name": "Remplissage en 3 et 4 semaines de repousses",
              "dur": "1h30",
              "price": 45
            },
            {
              "id": "gel-remp-5",
              "name": "Remplissage après 5 semaines de repousses",
              "dur": "1h30",
              "price": 49
            }
          ],
          "img": "assets/prestations/gel.jpg"
        },
        {
          "id": "capsule",
          "name": "Prestations Capsules",
          "children": [
            {
              "id": "americaine",
              "name": "Pose américaine",
              "children": [
                {
                  "id": "am-courte",
                  "name": "Courte ou medium",
                  "dur": "1h30",
                  "price": 48
                },
                {
                  "id": "am-longue",
                  "name": "Longue",
                  "dur": "1h30",
                  "price": 58
                }
              ],
              "img": "assets/prestations/americaine.jpg"
            },
            {
              "id": "popits",
              "name": "Rallongement popits et demi popits",
              "children": [
                {
                  "id": "popits-court",
                  "name": "Popits court ou medium",
                  "dur": "2h00",
                  "price": 55
                },
                {
                  "id": "popits-long",
                  "name": "Popits long",
                  "dur": "2h30",
                  "price": 63
                },
                {
                  "id": "demi-court",
                  "name": "Demi popits court ou medium",
                  "dur": "2h00",
                  "price": 59
                },
                {
                  "id": "demi-long",
                  "name": "Demi popits long",
                  "dur": "2h30",
                  "price": 66
                },
                {
                  "id": "popits-amande",
                  "name": "Popits amandes Russes",
                  "dur": "3h00",
                  "price": 70
                }
              ],
              "img": "assets/prestations/popits.jpg"
            }
          ],
          "img": "assets/prestations/capsule.jpg"
        },
        {
          "id": "semi",
          "name": "Semi-permanent",
          "children": [
            {
              "id": "semi-main-1",
              "name": "Semi permanent main première pose",
              "dur": "0h45",
              "price": 35
            },
            {
              "id": "semi-main-entretien",
              "name": "Entretien semi permanent mains",
              "dur": "0h45",
              "price": 40
            },
            {
              "id": "semi-pied-1",
              "name": "Semi permanent pied première pose",
              "dur": "0h45",
              "price": 32
            },
            {
              "id": "semi-pied-entretien",
              "name": "Entretien semi permanent pieds",
              "dur": "0h45",
              "price": 36
            }
          ],
          "img": "assets/prestations/semi.jpg"
        },
        {
          "id": "deco",
          "name": "Déco / Nail Arts",
          "children": [
            {
              "id": "deco-simple",
              "name": "Déco simple",
              "children": [
                {
                  "id": "deco-simple-unite",
                  "name": "Déco très simple à l’unité",
                  "dur": "0h15",
                  "price": 2
                },
                {
                  "id": "deco-simple-mains",
                  "name": "Déco très simple forfait mains complètes",
                  "dur": "0h30",
                  "price": 14
                }
              ],
              "img": "assets/prestations/deco-simple.jpg"
            },
            {
              "id": "deco-elab",
              "name": "Déco élaborée",
              "children": [
                {
                  "id": "fc",
                  "name": "French classique",
                  "children": [
                    {
                      "id": "fc-2",
                      "name": "Deux doigts",
                      "dur": "0h05",
                      "price": 4
                    },
                    {
                      "id": "fc-4",
                      "name": "Quatre doigts",
                      "dur": "0h10",
                      "price": 8
                    },
                    {
                      "id": "fc-6",
                      "name": "Six doigts",
                      "dur": "0h20",
                      "price": 12
                    },
                    {
                      "id": "fc-mains",
                      "name": "Mains complètes",
                      "dur": "0h30",
                      "price": 14
                    }
                  ],
                  "img": "assets/prestations/fc.jpg"
                },
                {
                  "id": "fo",
                  "name": "French originale",
                  "children": [
                    {
                      "id": "fo-2",
                      "name": "Deux doigts",
                      "dur": "0h05",
                      "price": 6
                    },
                    {
                      "id": "fo-4",
                      "name": "Quatre doigts",
                      "dur": "0h10",
                      "price": 12
                    },
                    {
                      "id": "fo-6",
                      "name": "Six doigts",
                      "dur": "0h20",
                      "price": 18
                    },
                    {
                      "id": "fo-mains",
                      "name": "Mains complètes",
                      "dur": "0h30",
                      "price": 21
                    }
                  ],
                  "img": "assets/prestations/fo.jpg"
                },
                {
                  "id": "fr",
                  "name": "French reverse",
                  "children": [
                    {
                      "id": "fr-2",
                      "name": "Deux doigts",
                      "dur": "0h20",
                      "price": 10
                    },
                    {
                      "id": "fr-4",
                      "name": "Quatre doigts",
                      "dur": "0h30",
                      "price": 18
                    },
                    {
                      "id": "fr-6",
                      "name": "Six doigts",
                      "dur": "0h40",
                      "price": 26
                    },
                    {
                      "id": "fr-mains",
                      "name": "Mains complètes",
                      "dur": "1h00",
                      "price": 30
                    }
                  ],
                  "img": "assets/prestations/fr.jpg"
                },
                {
                  "id": "dp",
                  "name": "Décos personnalisées",
                  "children": [
                    {
                      "id": "dp-simple",
                      "name": "Simple",
                      "children": [
                        {
                          "id": "dp-s2",
                          "name": "Deux doigts",
                          "dur": "0h05",
                          "price": 6
                        },
                        {
                          "id": "dp-s4",
                          "name": "Quatre doigts",
                          "dur": "0h10",
                          "price": 12
                        },
                        {
                          "id": "dp-s6",
                          "name": "Six doigts",
                          "dur": "0h15",
                          "price": 18
                        },
                        {
                          "id": "dp-smains",
                          "name": "Mains complètes",
                          "dur": "0h20",
                          "price": 21
                        }
                      ],
                      "img": "assets/prestations/dp-simple.jpg"
                    },
                    {
                      "id": "dp-complexe",
                      "name": "Complexe",
                      "children": [
                        {
                          "id": "dp-c2",
                          "name": "Deux doigts",
                          "dur": "0h10",
                          "price": 8
                        },
                        {
                          "id": "dp-c4",
                          "name": "Quatre doigts",
                          "dur": "0h20",
                          "price": 16
                        },
                        {
                          "id": "dp-c6",
                          "name": "Six doigts",
                          "dur": "0h40",
                          "price": 24
                        },
                        {
                          "id": "dp-cmains",
                          "name": "Mains complètes",
                          "dur": "0h50",
                          "price": 28
                        }
                      ],
                      "img": "assets/prestations/dp-complexe.jpg"
                    }
                  ],
                  "img": "assets/prestations/dp.jpg"
                },
                {
                  "id": "bb",
                  "name": "Babyboomer / babycolor",
                  "children": [
                    {
                      "id": "bb-2",
                      "name": "Deux doigts",
                      "dur": "0h10",
                      "price": 7
                    },
                    {
                      "id": "bb-4",
                      "name": "Quatre doigts",
                      "dur": "0h20",
                      "price": 14
                    },
                    {
                      "id": "bb-6",
                      "name": "Six doigts",
                      "dur": "0h30",
                      "price": 21
                    },
                    {
                      "id": "bb-mains",
                      "name": "Mains complètes",
                      "dur": "0h40",
                      "price": 25
                    }
                  ],
                  "img": "assets/prestations/bb.jpg"
                },
                {
                  "id": "inc",
                  "name": "Incrustation complète",
                  "children": [
                    {
                      "id": "inc-2",
                      "name": "Deux doigts",
                      "dur": "0h10",
                      "price": 6
                    },
                    {
                      "id": "inc-4",
                      "name": "Quatre doigts",
                      "dur": "0h20",
                      "price": 12
                    },
                    {
                      "id": "inc-6",
                      "name": "Six doigts",
                      "dur": "0h30",
                      "price": 18
                    },
                    {
                      "id": "inc-mains",
                      "name": "Mains complètes",
                      "dur": "0h40",
                      "price": 21
                    }
                  ],
                  "img": "assets/prestations/inc.jpg"
                },
                {
                  "id": "relief",
                  "name": "Déco relief",
                  "children": [
                    {
                      "id": "relief-2",
                      "name": "Deux doigts",
                      "dur": "0h10",
                      "price": 8
                    },
                    {
                      "id": "relief-4",
                      "name": "Quatre doigts",
                      "dur": "0h20",
                      "price": 16
                    },
                    {
                      "id": "relief-6",
                      "name": "Six doigts",
                      "dur": "0h30",
                      "price": 24
                    },
                    {
                      "id": "relief-mains",
                      "name": "Mains complètes",
                      "dur": "0h40",
                      "price": 28
                    }
                  ],
                  "img": "assets/prestations/relief.jpg"
                },
                {
                  "id": "stickers",
                  "name": "Stickers faits mains",
                  "children": [
                    {
                      "id": "stk-2",
                      "name": "Deux doigts",
                      "dur": "0h05",
                      "price": 14
                    },
                    {
                      "id": "stk-4",
                      "name": "Quatre doigts",
                      "dur": "0h10",
                      "price": 22
                    },
                    {
                      "id": "stk-6",
                      "name": "Six doigts",
                      "dur": "0h15",
                      "price": 30
                    },
                    {
                      "id": "stk-mains",
                      "name": "Mains complètes",
                      "dur": "0h20",
                      "price": 38
                    }
                  ],
                  "img": "assets/prestations/stickers.jpg"
                }
              ],
              "img": "assets/prestations/deco-elab.jpg"
            }
          ],
          "img": "assets/prestations/deco.jpg"
        },
        {
          "id": "casse",
          "name": "En cas de casse",
          "children": [
            {
              "id": "casse-1",
              "name": "Réparation ongle cassé la 1ère semaine",
              "dur": "0h15",
              "price": 0
            },
            {
              "id": "casse-2",
              "name": "Réparation à partir de la 2ème semaine hors remplissage",
              "dur": "0h15",
              "price": 4
            },
            {
              "id": "casse-3",
              "name": "Réparation ongle cassé pendant le remplissage",
              "dur": "0h15",
              "price": 2
            }
          ],
          "img": "assets/prestations/casse.jpg"
        },
        {
          "id": "deposes",
          "name": "Les déposes",
          "children": [
            {
              "id": "dep-travail",
              "name": "Dépose complète de mon travail",
              "dur": "0h30",
              "price": 20
            },
            {
              "id": "dep-autre",
              "name": "Dépose complète autre professionnelle",
              "dur": "0h30",
              "price": 25
            },
            {
              "id": "dep-autre-repose",
              "name": "Dépose complète autre professionnelle avec repose",
              "dur": "0h30",
              "price": 10
            },
            {
              "id": "dep-semi",
              "name": "Dépose semi permanent",
              "dur": "0h20",
              "price": 12
            },
            {
              "id": "dep-rattrapage",
              "name": "Rattrapage autre professionnelle",
              "dur": "0h30",
              "price": 8
            }
          ],
          "img": "assets/prestations/deposes.jpg"
        }
      ],
      "img": "assets/prestations/onglerie.jpg"
    },
    {
      "id": "press",
      "name": "Press on nails",
      "children": [
        {
          "id": "press-kit",
          "name": "Kit complet + prise de mesure",
          "dur": "0h30",
          "price": 30
        },
        {
          "id": "press-kit-seul",
          "name": "Kit complet uniquement",
          "dur": "0h30",
          "price": 25
        }
      ],
      "img": "assets/prestations/press.jpg"
    }
  ]
};

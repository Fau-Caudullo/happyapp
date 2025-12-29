export const getAlmanacco = () => {
  const oggi = new Date();
  const giorno = oggi.getDate();
  const mese = oggi.getMonth() + 1;
  const chiave = `${giorno}-${mese}`;

  const santi = {
    "1-1": "Maria SS. Madre di Dio",
    "6-1": "Epifania del Signore",
    "14-2": "San Valentino",
    "19-3": "San Giuseppe",
    "24-6": "San Giovanni Battista",
    "15-8": "Assunzione di Maria",
    "1-11": "Tutti i Santi",
    "8-12": "Immacolata Concezione",
    "25-12": "Natale del Signore",
    "26-12": "Santo Stefano",
    "27-12": "San Giovanni Evangelista",
    "28-12": "Santi Innocenti Martiri",
    "31-12": "San Silvestro"
  };

  const fatti = {
    "27-12": "Nel 1947 viene promulgata la Costituzione Italiana.",
    "28-12": "Nel 1895 nasce ufficialmente il Cinema a Parigi.",
    "1-1": "Nel 2002 l'Euro diventa la moneta corrente.",
    "6-1": "Nel 1954 iniziano ufficialmente le trasmissioni TV in Italia.",
  };

  return {
    santo: santi[chiave] || "Santi del Giorno",
    curiosita: fatti[chiave] || "Oggi è una nuova pagina bianca da scrivere con gioia!"
  };
};
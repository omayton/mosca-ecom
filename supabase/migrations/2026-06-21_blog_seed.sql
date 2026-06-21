-- Migration: Conteúdo inicial do blog (artigos autorais)
-- Rode no SQL Editor do Supabase Dashboard. Idempotente (ON CONFLICT).

INSERT INTO blog_posts (slug, title, excerpt, content, cover_image_url, author, category, tags, reading_minutes, meta_description, is_published, published_at)
VALUES

(
  '5-sinais-pastilhas-freio-troca',
  '5 sinais de que as pastilhas de freio precisam de troca',
  'Freio é item de segurança. Aprenda a identificar os sinais de desgaste antes que vire problema na estrada.',
  E'# Por que ficar atento ao freio\n\nO sistema de freio é o item de segurança mais importante do carro — e o mais negligenciado. Muitos motoristas só lembram dele quando o pedal fica estranho. O problema é que a essa altura o reparo já saiu bem mais caro.\n\nA boa notícia: as pastilhas avisam antes de falhar. Basta saber ouvir.\n\n## 1. Chiado ao frear\n\nAquele barulho fino e constante quando você pisa no freio geralmente é o **indicador de desgaste** da pastilha tocando no disco. Foi feito justamente para isso: te avisar que a pastilha está no fim.\n\nSe ignorar, o chiado vira rangido — e o rangido vira disco avariado.\n\n## 2. O pedal está mais "longo"\n\nSe você precisa afundar mais o pedal para o carro parar, algo mudou. Pode ser pastilha gasta, fluidido velho ou ar no sistema. Em qualquer dos casos, está na hora de revisar.\n\n## 3. O carro "puxa" para um lado\n\nQuando você freia e o veículo desloca para a esquerda ou direita, o sistema não está atuando igual nos dois lados. Costuma ser pastilhas com desgaste desigual ou pinça travando.\n\n## 4. Vibração no pedal\n\nPedal pulsando ou vibrando indica disco empenado ou com superfície irregular. Geralmente vem de pastilhas que ficaram gastas demais por muito tempo.\n\n## 5. Mais de 30 mil km nas pastilhas\n\nA vida útil varia muito (de 20 a 60 mil km conforme uso), mas passou dos 30 mil sem revisão, é prudente mandar verificar. Cidade com trânsito pesado desgasta mais rápido.\n\n## Conclusão\n\nFreio não é onde se economiza. Trocar a pastilha a tempo custa pouco; trocar disco e pinça custa caro — e o risco no meio do caminho não tem preço.\n\nPrecisando de pastilhas, discos ou componentes do sistema de freio? [Veja nosso catálogo](https://www.moscabrancaparts.com.br/loja?categoria=freios).',
  NULL,
  'Equipe Mosca Branca Parts',
  'Manutenção',
  ARRAY['freio', 'segurança', 'pastilhas', 'manutenção'],
  3,
  'Aprenda os 5 sinais de desgaste das pastilhas de freio antes que virem problema.',
  true,
  now()
) ON CONFLICT (slug) DO NOTHING,

(
  'como-identificar-pecas-falsas',
  'Peças falsas: como identificar e não cair em golpe',
  'Uma peça falsa pode custar barato na hora — e caro depois. Saiba o que observar antes de comprar.',
  E'# O problema da peça falsificada\n\nNinguém quer pagar por peça original e receber imitação. Além do prejuízo financeiro, uma peça de má qualidade pode comprometer segurança e durabilidade do carro.\n\nEm lojas especializadas e de confiança esse risco é muito menor. Mas vale saber diferenciar.\n\n## 1. Preço bom demais\n\nPeça automotiva original tem um custo de produção real. Se o desconto for absurdamente maior que o mercado todo, desconfie. **Barato que custa caro** é a regra aqui.\n\n## 2. Acabamento e encaixe\n\nPeça de qualidade tem acabamento limpo: rebarbas mínimas, superfícies uniformes, encaixe preciso. Imitação costuma ter imperfeições visíveis e folga no encaixe.\n\n## 3. Embalagem e identificação\n\nProduto sério vem com embalagem adequada, código de fabricação, lote e instruções. Embalagem genérica, sem qualquer marcação, é sinal de alerta.\n\n## 4. Rigidez e material\n\nCompare com a peça antiga. Se a nova parece frágil, mole ou com brilho estranho, o material provavelmente é inferior. Peças plásticas de acabamento, tampas e interruptores sofrem muito com isso.\n\n## 5. Compre de quem conhece\n\nO jeito mais seguro de evitar peça falsa é comprar de lojas especializadas, com histórico e avaliação de clientes reais. Quem vive do assunto sabe o que está vendendo.\n\n## Conclusão\n\nEm dúvida, pergunte. Uma loja que se preza responde sobre origem, compatibilidade e garantia do produto sem enrolação.\n\nA [Mosca Branca Parts](https://www.moscabrancaparts.com.br/loja) trabalha só com peças selecionadas, com garantia e envio para todo Brasil.',
  NULL,
  'Equipe Mosca Branca Parts',
  'Dicas',
  ARRAY['peças', 'compra', 'segurança', 'dicas'],
  3,
  'Como identificar peças automotivas falsificadas e evitar golpes na hora de comprar.',
  true,
  now() - interval '1 day'
) ON CONFLICT (slug) DO NOTHING,

(
  'saidas-de-ar-aftermarket-vs-original',
  'Saídas de ar: quando o aftermarket é melhor que a original',
  'Nem sempre a peça da concessionária é a melhor opção. Veja quando uma saída de ar paralela vale a pena.',
  E'# A maldição da peça fora de linha\n\nSaiu uma saída de ar do painel do seu carro e você foi até a concessionária. Resposta clássica: *"Essa peça só vem com o painel inteiro, são R$ 3.000."*\n\nFoi exatamente para resolver esse tipo de absurdo que o mercado de peças raras cresceu.\n\n## Por que o aftermarket resolve\n\nMuitos fabricantes de peças paralelas produzem componentes que imitam — ou melhoram — a original. Para itens de acabamento como saídas de ar, tampas e difusores, a função é mais estética e estrutural do que mecânica.\n\nOu seja: uma peça bem feita cumpre o papel a um custo muito menor.\n\n## O que observar ao comprar\n\n- **Encaixe**: tem que entrar no lugar da original sem adaptadores improvisados\n- **Cor e textura**: precisa combinar com o restante do painel\n- **Fixação**: presilhas e encaixes firmes, sem folga\n- **Material**: plástico de boa rigidez, não quebradiço\n\n## Quando NÃO trocar por paralela\n\nPeças envolvidas em segurança estrutural ou sistemas eletrônicos sensíveis pedem mais cuidado. Para saídas de ar, difusores e acabamento, o paralelo de qualidade é tranquilamente uma boa opção.\n\n## Conclusão\n\nAntes de aceitar aquele orçamento de painel inteiro, vale procurar a peça avulsa. Muitas vezes existe — e custa uma fração do preço.\n\nProcurando uma saída de ar específica? [Confira nossas saídas de ar](https://www.moscabrancaparts.com.br/loja?categoria=saidas-de-ar).',
  NULL,
  'Equipe Mosca Branca Parts',
  'Peças',
  ARRAY['saídas de ar', 'acabamento', 'peças raras', 'aftermarket'],
  4,
  'Quando uma saída de ar paralela de qualidade vale mais que a peça da concessionária.',
  true,
  now() - interval '2 days'
) ON CONFLICT (slug) DO NOTHING,

(
  'checklist-manutencao-preventiva-viagem',
  'Checklist de manutenção preventiva para viagens de feriado',
  'Antes de pegar a estrada, passe por este checklist. Cinco minutos de revisão evitam horas de prejuízo.',
  E'# A estrada não perdoa improviso\n\nViagem de feriado é assim: muita gente na pista, trânsito pesado e aquele carro que simplesmente não foi revisado. O resultado é o acostamento lotado de gente esperando guincho.\n\nA manutenção preventiva é barata e rápida comparada a uma pane no meio do nada.\n\n## Os 7 pontos essenciais\n\n### 1. Pneus\n\nCalibre todos (incluindo o estepe) e confira o sulco. Pneu careca na chuva é uma das maiores causas de acidente. Se está perto do limite, troque antes de viajar.\n\n### 2. Freios\n\nPastilhas, disco e fluido. Se o freio está fazendo barulho ou o pedal está diferente, resolva antes — não na estrada.\n\n### 3. Óleo e filtros\n\nÓleo no nível e dentro do prazo. Filtro de óleo e de ar em dia. Viagem longa com óleo vencido é pedir problema.\n\n### 4. Líquidos\n\nÁgua do radiador, líquido de arrefecimento, fluido de freio e de direção. Tudo no nível.\n\n### 5. Luzes\n\nFarol alto, baixo, pisca, freio e ré. Uma lâmpada queimada dificulta ver e ser visto — e rende multa.\n\n### 6. Limpador de para-brisa\n\nPalhetas gastas + chuva = visibilidade zero. É item barato e faz diferença enorme.\n\n### 7. Estepe, macaco e triângulo\n\nConfira se o estepe está bom e calibrado, e se as ferramentas estão no carro. Parece óbvio, mas muita gente viaja sem.\n\n## Conclusão\n\nMeia hora de revisão antes da viagem pode salvar o feriado inteiro. E se descobriu que precisa de alguma peça, vale resolver antes — peça na estrada é sempre mais cara.\n\nPara peças de manutenção, [veja o catálogo](https://www.moscabrancaparts.com.br/loja).',
  NULL,
  'Equipe Mosca Branca Parts',
  'Manutenção',
  ARRAY['manutenção', 'viagem', 'segurança', 'checklist'],
  4,
  'Checklist completo de manutenção preventiva para viajar de carro com segurança.',
  true,
  now() - interval '3 days'
) ON CONFLICT (slug) DO NOTHING,

(
  'ruidos-estranhos-no-painel',
  'Ruídos estranhos no painel: o que pode ser e como resolver',
  'Aquele barulhinho chato que aparece no painel tem solução. Veja as causas mais comuns.',
  E'# O tal do barulho que ninguém aguenta\n\nTem coisa mais irritante do que um barulho no painel que só aparece quando o carro está quente, numa curva específica, numa velocidade exata? Pois é, esse tipo de coisa tira o sono de qualquer motorista.\n\nA boa notícia: a maioria tem causa simples e solução barata.\n\n## As causas mais comuns\n\n### 1. Peças soltas ou com fixação gasta\n\nTampas, acabamentos, difusores de ar e encaixes do painel costumam soltar presilhas com o tempo. A vibração do motor faz a peça bater e gerar o ruído.\n\n**Solução**: repor a peça ou a presilha de fixação. Geralmente resolve na hora.\n\n### 2. Saídas de ar com aletas frouxas\n\nAs aletas das saídas de ar, quando perdem rigidez, vibram com o motor ligado. Trocar a saída de ar resolve.\n\n### 3. Parafusos do painel\n\nCom o uso, parafusos internos do painel podem afrouxar. É mais raro, mas acontece — principalmente em carros com mais idade.\n\n### 4. Itens atrás do painel\n\nCabo solto, dutos de ventilação mal fixados, até um objeto caído na região. Às vezes a remoção do painel é necessária para identificar.\n\n## Como investigar\n\n- Anote **quando** o barulho aparece (curva, lombada, alta rotação)\n- Peça para alguém dirigir enquanto você escuta de dentro\n- Aperte suavemente áreas do painel para ver se o barulho para — isso localiza a peça culpada\n\n## Conclusão\n\nRuído de painel raramente é problema grave, mas é daqueles que só piora se ignorar. Identificar a peça e trocar é o caminho mais limpo.\n\nProcurando peças de acabamento, tampas ou saídas de ar? [Veja as opções](https://www.moscabrancaparts.com.br/loja).',
  NULL,
  'Equipe Mosca Branca Parts',
  'Manutenção',
  ARRAY['painel', 'ruídos', 'acabamento', 'manutenção'],
  4,
  'Causas mais comuns de ruídos no painel do carro e como resolver de forma simples.',
  true,
  now() - interval '4 days'
) ON CONFLICT (slug) DO NOTHING;

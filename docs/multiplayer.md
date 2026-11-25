# Modo Dupla (multiplayer online) — desenho técnico

## Objetivo
Dois celulares jogam juntos capítulos da história de Davi: **Davi** (quem cria a sala) e **Jônatas** (quem entra).

## Conexão
- **WebRTC direto entre os aparelhos** (PeerJS). O servidor público do PeerJS só apresenta os dois (sinalização);
  o jogo trafega direto entre os celulares. STUN do Google para atravessar roteadores.
- Sala = código de 5 letras (sem letras confusas: sem O/0, I/1). O id PeerJS do anfitrião é `jogosieq-davi-<CÓDIGO>`.
- Convite: link `…/?sala=CÓDIGO` (botão de compartilhar) ou digitar o código.
- Limitação conhecida: em algumas redes móveis (NAT simétrico) a conexão direta pode falhar sem um servidor TURN.
  A interface avisa e sugere usar Wi‑Fi. Um TURN pode ser ligado depois em `src/net/room.ts` (ICE servers).
- Testes: `window.__peerConfig` aponta para um servidor PeerJS local.

## Protocolo (versão 1, mensagens JSON)
| Mensagem | De | Conteúdo |
|---|---|---|
| `hello {v}` | Jônatas | versão do protocolo; versões diferentes são recusadas |
| `welcome {v}` | Davi | aceita a entrada |
| `ping {at}` / `pong {at}` | ambos | latência (a cada 1,5 s); 5 s sem nada = conexão perdida; ao fechar a página o aparelho envia `bye` |
| `menu {chapter, diff}` | Davi | capítulo escolhido |
| `ready {phase}` | ambos | terminou de ler a conversa; o jogo começa quando os dois estão prontos |
| `start {chapter, seed, diff}` | Davi | começa o desafio; a semente garante o mesmo sorteio nos dois aparelhos |
| `g {…}` | ambos | mensagens do jogo (abaixo) |
| `end {stars}` | Davi | resultado |
| `bye` | ambos | saiu da sala |

## Autoridade
- Cada aparelho controla **o próprio herói** (resposta imediata ao toque) e envia posição/animação ~20×/s;
  o parceiro aparece interpolado (≈100 ms de atraso, suave mesmo com rede irregular).
- **Davi (anfitrião) decide o mundo compartilhado**: itens pegos, chaves, portas, checkpoints, vitória e placar.
  Jônatas pede (“peguei a chave”), Davi confirma e envia o estado; se os dois pegam ao mesmo tempo, vale o primeiro.
- Placas de pressão e portões derivam das posições dos dois heróis (mesma regra nos dois aparelhos).
- Guardas andam por uma rota fixa no tempo, igual nos dois aparelhos (não precisam de rede).

## Jogos em dupla
1. **A aliança** (1 Sm 18:1-4) — fase de plataforma em dupla: segurar placas para o outro passar, subir nos ombros do parceiro, chaves compartilhadas.
2. **Contra os filisteus** (1 Sm 18:30) — defesa: Davi (funda) protege a esquerda, Jônatas (arco) a direita. Davi simula os inimigos; Jônatas envia os disparos.
3. **Os sinais das flechas** (1 Sm 20) — comunicação: só Jônatas sabe a intenção de Saul e atira a flecha; só Davi decide ficar ou fugir.
4. **O encontro em Horesa** (1 Sm 23:16-18) — segunda fase de plataforma em dupla, no deserto.

## Arquivos
- `src/net/room.ts` — sala, protocolo, ping, estados de conexão.
- `src/games/david/coop/*` — sala/convite, fluxo dos capítulos e os quatro jogos.

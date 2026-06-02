import { TopHeader } from "@/components/automotive/top-header"

export const metadata = {
  title: "Termos de Uso | Mosca Branca Parts",
  description: "Termos e condições de uso do site Mosca Branca Parts.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <TopHeader />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="font-bold text-zinc-900 text-3xl mb-8">Termos de Uso</h1>
        <div className="bg-white border border-zinc-100 rounded-xl p-8 shadow-sm prose prose-zinc prose-sm max-w-none">
          <p className="text-zinc-500 text-sm mb-6">Última atualização: Junho de 2025</p>

          <h2>1. Aceitação dos termos</h2>
          <p>Ao acessar e utilizar o site Mosca Branca Parts (moscabrancaparts.com.br), você concorda com estes termos de uso. Se não concordar, não utilize o site.</p>

          <h2>2. Sobre a loja</h2>
          <p>A Mosca Branca Parts é uma loja virtual especializada em peças automotivas raras e de difícil localização no mercado nacional. Atuamos com peças de reposição originais e compatíveis.</p>

          <h2>3. Cadastro</h2>
          <ul>
            <li>Você deve fornecer informações verdadeiras e atualizadas</li>
            <li>É responsável por manter a segurança da sua senha</li>
            <li>Deve ter pelo menos 18 anos ou autorização de responsável legal</li>
            <li>Uma conta por pessoa (CPF)</li>
          </ul>

          <h2>4. Produtos e preços</h2>
          <ul>
            <li>Os preços são em Reais (BRL) e podem ser alterados sem aviso prévio</li>
            <li>Fotos são ilustrativas — podem haver variações de cor e acabamento</li>
            <li>A disponibilidade está sujeita ao estoque</li>
            <li>Nos reservamos o direito de limitar quantidades por pedido</li>
            <li>Desconto de 5% no PIX é aplicado automaticamente</li>
          </ul>

          <h2>5. Pagamento</h2>
          <ul>
            <li>Aceitamos PIX e cartão de crédito (até 6x sem juros)</li>
            <li>O pedido só é confirmado após aprovação do pagamento</li>
            <li>Pagamentos via PIX devem ser realizados em até 30 minutos</li>
            <li>Pagamentos são processados pelo MercadoPago</li>
          </ul>

          <h2>6. Entrega</h2>
          <ul>
            <li>Enviamos para todo o Brasil via Correios e transportadoras</li>
            <li>O prazo de entrega começa a contar após confirmação do pagamento</li>
            <li>Prazos são estimativas e podem variar conforme a região</li>
            <li>O frete é calculado com base no CEP, peso e dimensões do produto</li>
            <li>Não nos responsabilizamos por atrasos dos Correios ou transportadoras</li>
          </ul>

          <h2>7. Trocas e devoluções</h2>
          <ul>
            <li><strong>Arrependimento:</strong> 7 dias corridos após o recebimento (Art. 49 do CDC)</li>
            <li><strong>Defeito:</strong> 30 dias para produtos não duráveis, 90 dias para duráveis</li>
            <li>O produto deve estar na embalagem original, sem sinais de uso</li>
            <li>O frete de devolução por arrependimento é por conta do cliente</li>
            <li>O frete de devolução por defeito é por nossa conta</li>
            <li>O reembolso é feito na mesma forma de pagamento em até 10 dias úteis</li>
          </ul>

          <h2>8. Garantia</h2>
          <p>Oferecemos 30 dias de garantia contra defeitos de fabricação em todos os produtos, além da garantia legal do CDC.</p>

          <h2>9. Responsabilidades do cliente</h2>
          <ul>
            <li>Verificar compatibilidade da peça com seu veículo antes da compra</li>
            <li>Conferir o produto no ato do recebimento</li>
            <li>Não utilizar o site para fins ilícitos</li>
            <li>Manter seus dados cadastrais atualizados</li>
          </ul>

          <h2>10. Limitação de responsabilidade</h2>
          <p>A Mosca Branca Parts não se responsabiliza por:</p>
          <ul>
            <li>Danos causados por instalação incorreta das peças</li>
            <li>Incompatibilidade de peças não verificada pelo cliente</li>
            <li>Indisponibilidade temporária do site</li>
            <li>Atrasos causados por terceiros (Correios, transportadoras, gateway de pagamento)</li>
          </ul>

          <h2>11. Propriedade intelectual</h2>
          <p>Todo o conteúdo do site (textos, imagens, layout, código) é de propriedade da Mosca Branca Parts e protegido por leis de direitos autorais.</p>

          <h2>12. Foro</h2>
          <p>Fica eleito o foro da comarca de Uberlândia/MG para dirimir quaisquer questões decorrentes destes termos.</p>

          <h2>13. Contato</h2>
          <ul>
            <li>WhatsApp: (34) 99936-5936</li>
            <li>Horário: Segunda a Sábado</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

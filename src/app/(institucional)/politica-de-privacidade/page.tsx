import { TopHeader } from "@/components/automotive/top-header"

export const metadata = {
  title: "Política de Privacidade | Mosca Branca Parts",
  description: "Política de privacidade e proteção de dados da Mosca Branca Parts, conforme a LGPD.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <TopHeader />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="font-inter font-bold text-zinc-900 text-3xl mb-8">Política de Privacidade</h1>
        <div className="bg-white border border-zinc-100 rounded-xl p-8 shadow-sm prose prose-zinc prose-sm max-w-none font-inter">
          <p className="text-zinc-500 text-sm mb-6">Última atualização: Junho de 2025</p>

          <h2>1. Informações que coletamos</h2>
          <p>A Mosca Branca Parts coleta as seguintes informações pessoais quando você utiliza nosso site:</p>
          <ul>
            <li><strong>Dados de cadastro:</strong> nome, email, telefone, CPF</li>
            <li><strong>Dados de entrega:</strong> endereço completo (CEP, rua, número, bairro, cidade, estado)</li>
            <li><strong>Dados de pagamento:</strong> processados diretamente pelo MercadoPago — não armazenamos dados de cartão</li>
            <li><strong>Dados de navegação:</strong> páginas visitadas, produtos visualizados, IP, dispositivo</li>
          </ul>

          <h2>2. Finalidade da coleta</h2>
          <p>Utilizamos seus dados para:</p>
          <ul>
            <li>Processar e entregar seus pedidos</li>
            <li>Calcular frete e prazos de entrega</li>
            <li>Emitir nota fiscal</li>
            <li>Comunicar sobre status de pedidos</li>
            <li>Melhorar a experiência de navegação</li>
            <li>Prevenir fraudes</li>
          </ul>

          <h2>3. Compartilhamento de dados</h2>
          <p>Compartilhamos dados apenas com:</p>
          <ul>
            <li><strong>MercadoPago:</strong> processamento de pagamentos</li>
            <li><strong>Melhor Envio / Correios:</strong> cálculo e envio de encomendas</li>
            <li><strong>Supabase:</strong> armazenamento seguro de dados (servidores na AWS)</li>
          </ul>
          <p>Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins de marketing.</p>

          <h2>4. Segurança dos dados</h2>
          <ul>
            <li>Conexão criptografada (HTTPS/TLS)</li>
            <li>Senhas armazenadas com hash seguro (bcrypt)</li>
            <li>Dados de pagamento tokenizados (nunca armazenados em nossos servidores)</li>
            <li>Acesso restrito ao banco de dados (Row Level Security)</li>
          </ul>

          <h2>5. Seus direitos (LGPD)</h2>
          <p>Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a:</p>
          <ul>
            <li>Acessar seus dados pessoais</li>
            <li>Corrigir dados incompletos ou desatualizados</li>
            <li>Solicitar a exclusão dos seus dados</li>
            <li>Revogar consentimento</li>
            <li>Solicitar portabilidade dos dados</li>
          </ul>
          <p>Para exercer seus direitos, entre em contato pelo WhatsApp (34) 99936-5936 ou email.</p>

          <h2>6. Cookies</h2>
          <p>Utilizamos cookies para:</p>
          <ul>
            <li><strong>Essenciais:</strong> manter sua sessão de login e carrinho de compras</li>
            <li><strong>Funcionais:</strong> lembrar seu CEP e preferências</li>
            <li><strong>Analíticos:</strong> entender como o site é utilizado (Google Analytics)</li>
          </ul>
          <p>Você pode gerenciar cookies nas configurações do seu navegador.</p>

          <h2>7. Retenção de dados</h2>
          <ul>
            <li>Dados de pedidos: mantidos por 5 anos (obrigação fiscal)</li>
            <li>Dados de conta: mantidos enquanto a conta estiver ativa</li>
            <li>Dados de navegação: até 12 meses</li>
          </ul>

          <h2>8. Contato</h2>
          <p>Para dúvidas sobre privacidade:</p>
          <ul>
            <li>WhatsApp: (34) 99936-5936</li>
            <li>Horário: Segunda a Sábado</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

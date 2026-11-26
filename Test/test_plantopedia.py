import pytest
from playwright.sync_api import sync_playwright, expect

@pytest.fixture(scope="session")
def browser_context():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=300)
        context = browser.new_context()
        yield context
        browser.close()

def navegar_ate_plantopedia(page, email, senha):
    """Função auxiliar: Realiza o login, passa pelo Hub e acede à Plantopédia."""
    page.goto("http://127.0.0.1:5500/Client/index.html")
    page.fill("#email", email)
    page.fill("#password", senha)
    page.click("#btn-login")
    
    # Aguarda o redirecionamento bem-sucedido para o Hub
    page.wait_for_url("**/Client/hub.html")
    
    # Clica especificamente no card da Plantopédia no grid principal (evita o menu lateral)
    page.click("a.feature-box[href='plantopedia.html']")
    
    # Garante que chegou à Plantopédia
    page.wait_for_url("**/Client/plantopedia.html")

def test_usuario_comum_sem_privilegios_bloqueado(browser_context):
    """Valida se um utilizador comum não tem acesso aos botões de gestão na Plantopédia."""
    page = browser_context.new_page()
    
    # Fluxo: Login (User Comum) -> Hub -> Plantopédia
    navegar_ate_plantopedia(page, "teste@gmail.com", "1234567890")
    
    # Valida que o botão de adicionar planta (#ppBtnAdd) NÃO está visível para utilizadores comuns
    btn_adicionar = page.locator("#ppBtnAdd")
    expect(btn_adicionar).not_to_be_visible()

def test_filtro_por_nome_planta(browser_context):
    """Valida se o filtro de pesquisa por nome funciona na Plantopédia."""
    page = browser_context.new_page()
    
    # Fluxo: Login (Admin) -> Hub -> Plantopédia
    navegar_ate_plantopedia(page, "testetiadmin@gmail.com", "TIMello@2026")
    
    # Escreve o nome de uma planta no campo de busca correto (#ppSearch)
    page.fill("#ppSearch", "Manjericão")
    
    # Verifica a grelha de resultados
    expect(page.locator("#ppGrid")).to_be_visible()

def test_crud_completo_admin(browser_context):
    """Valida o ciclo de CRUD completo (Adicionar, Editar, Apagar) com privilégios de Admin."""
    page = browser_context.new_page()
    
    # Fluxo: Login (Admin) -> Hub -> Plantopédia
    navegar_ate_plantopedia(page, "testetiadmin@gmail.com", "TIMello@2026")
    
    # 1. Adicionar Planta (abre o modal através do #ppBtnAdd)
    page.click("#ppBtnAdd")
    
    page.fill("#ppName", "Samambaia Teste")
    page.fill("#ppScientific", "Nephrolepis exaltata")
    page.select_option("#ppCategory", "Outra")
    page.fill("#ppInfo", "Planta de teste automatizado para validação")
    page.click("#ppBtnSubmit")
    
    # Valida se apareceu na grelha (#ppGrid)
    expect(page.locator("text=Samambaia Teste")).to_be_visible()
    
    # 2. Clica na planta criada para abrir os detalhes
    page.click("text=Samambaia Teste")
    
    # Clica em editar
    page.click("#ppDetailEdit")
    page.fill("#ppName", "Samambaia Atualizada")
    page.click("#ppBtnSubmit")
    expect(page.locator("text=Samambaia Atualizada")).to_be_visible()
    
   # 5. Excluir Planta
    page.click("text=Samambaia Atualizada")
    page.on("dialog", lambda dialog: dialog.accept())
    page.click("#ppDetailDelete")
    
    # Valida que a planta foi removida da grelha usando um seletor estrito e preciso
    expect(page.locator("#ppGrid").locator("text=Samambaia Atualizada")).not_to_be_visible()
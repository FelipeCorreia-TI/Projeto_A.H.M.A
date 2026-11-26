import pytest
from playwright.sync_api import sync_playwright, expect

@pytest.fixture(scope="session")
def browser_context():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=300)
        context = browser.new_context()
        yield context
        browser.close()

def fazer_login(page, email, senha):
    """Função auxiliar para realizar o login e navegar até ao Hub."""
    page.goto("http://127.0.0.1:5500/Client/index.html")
    page.fill("#email", email)
    page.fill("#password", senha)
    page.click("#btn-login")
    page.wait_for_url("**/Client/hub.html")

def test_interacao_sidebar_e_navegacao(browser_context):
    """Valida a abertura da sidebar através do botão hambúrguer e a navegação por todos os seus links."""
    page = browser_context.new_page()
    
    # 1. Login como Administrador
    fazer_login(page, "testetiadmin@gmail.com", "TIMello@2026")
    
    # 2. Clica no botão do menu hambúrguer (#BtnMenu) para abrir/interagir com a sidebar
    btn_menu = page.locator("#BtnMenu")
    expect(btn_menu).to_be_visible()
    btn_menu.click()
    
    # 3. Valida a visibilidade da sidebar e testa os links do menu
    sidebar = page.locator("#sidebar")
    expect(sidebar).to_be_visible()
    
    # Clica no link "Plantopédia" dentro da sidebar
    page.click("#sidebar a[href*='plantopedia.html']")
    page.wait_for_url("**/Client/plantopedia.html")
    
    # Abre o menu novamente e navega para "Monitoramento do Solo"
    btn_menu.click()
    page.click("#sidebar a[href*='sensores.html']")
    page.wait_for_url("**/Client/sensores.html")
    
    # Abre o menu e retorna para a página Inicial (Início)
    btn_menu.click()
    page.click("#sidebar a[href*='hub.html']")
    page.wait_for_url("**/Client/hub.html")

def test_jornada_usuario_comum_restricoes(browser_context):
    """Valida o fluxo do utilizador comum: Login -> Hub -> Plantopédia (sem privilégios de escrita)."""
    page = browser_context.new_page()
    fazer_login(page, "teste@gmail.com", "1234567890")
    
    page.click("a.feature-box[href='plantopedia.html']")
    page.wait_for_url("**/Client/plantopedia.html")
    
    btn_adicionar = page.locator("#ppBtnAdd")
    expect(btn_adicionar).not_to_be_visible()

def test_jornada_admin_crud_e_filtro(browser_context):
    """Valida o fluxo completo do administrador: Login -> Hub -> Plantopédia -> Filtro -> CRUD Completo."""
    page = browser_context.new_page()
    fazer_login(page, "testetiadmin@gmail.com", "TIMello@2026")
    
    page.click("a.feature-box[href='plantopedia.html']")
    page.wait_for_url("**/Client/plantopedia.html")
    
    # Testa o Filtro por nome
    page.fill("#ppSearch", "Manjericão")
    expect(page.locator("#ppGrid")).to_be_visible()
    page.fill("#ppSearch", "")
    
    # Adicionar Nova Planta
    page.click("#ppBtnAdd")
    page.fill("#ppName", "Samambaia Teste E2E")
    page.fill("#ppScientific", "Nephrolepis exaltata")
    page.select_option("#ppCategory", "Outra")
    page.fill("#ppInfo", "Planta criada através de teste automatizado end-to-end.")
    page.click("#ppBtnSubmit")
    expect(page.locator("text=Samambaia Teste E2E")).to_be_visible()
    
    # Editar a Planta criada
    page.click("text=Samambaia Teste E2E")
    page.click("#ppDetailEdit")
    page.fill("#ppName", "Samambaia Atualizada E2E")
    page.click("#ppBtnSubmit")
    expect(page.locator("text=Samambaia Atualizada E2E")).to_be_visible()
    
    # Excluir a Planta
    page.click("text=Samambaia Atualizada E2E")
    page.on("dialog", lambda dialog: dialog.accept())
    page.click("#ppDetailDelete")
    expect(page.locator("#ppGrid").locator("text=Samambaia Atualizada E2E")).not_to_be_visible()

def test_percorrer_todas_as_hortas_e_sensores(browser_context):
    """Percorre o Hub, entra no monitoramento e visita todas as páginas de cada horta individualmente."""
    page = browser_context.new_page()
    fazer_login(page, "testetiadmin@gmail.com", "TIMello@2026")
    
    page.click("a.feature-box[href='sensores.html']")
    page.wait_for_url("**/Client/sensores.html")
    
    # Horta Um
    expect(page.locator("a[href='monitoramento/horta_um.html']")).to_be_visible()
    page.click("a[href='monitoramento/horta_um.html']")
    page.wait_for_url("**/Client/monitoramento/horta_um.html")
    page.click("#login-content")
    page.wait_for_url("**/Client/sensores.html")
    
    # Horta Dois
    expect(page.locator("a[href='monitoramento/horta_dois.html']")).to_be_visible()
    page.click("a[href='monitoramento/horta_dois.html']")
    page.wait_for_url("**/Client/monitoramento/horta_dois.html")
    page.click("#login-content")
    page.wait_for_url("**/Client/sensores.html")
    
    # Horta Três
    expect(page.locator("a[href='monitoramento/horta_tres.html']")).to_be_visible()
    page.click("a[href='monitoramento/horta_tres.html']")
    page.wait_for_url("**/Client/monitoramento/horta_tres.html")

def test_fluxo_logout(browser_context):
    """Valida se o botão de sair no Hub encerra a sessão corretamente e redireciona para o login."""
    page = browser_context.new_page()
    fazer_login(page, "testetiadmin@gmail.com", "TIMello@2026")
    
    # Clica no botão de Sair e aguarda explicitamente pela mudança de URL para o index.html
    page.click("#login-content")
    
    # Aguarda o redirecionamento completo gerado pelo script de logout
    page.wait_for_url("**/Client/index.html", timeout=10000)
    
    # Valida o retorno à página de autenticação
    expect(page).to_have_url("**/Client/index.html")
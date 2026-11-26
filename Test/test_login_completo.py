import pytest
from playwright.sync_api import sync_playwright, expect

@pytest.fixture(scope="session")
def browser_context():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=300)
        context = browser.new_context()
        yield context
        browser.close()

@pytest.fixture
def login_page(browser_context):
    page = browser_context.new_page()
    page.goto("http://127.0.0.1:5500/Client/index.html")
    return page

def test_elementos_iniciais_login(login_page):
    """Valida se todos os elementos essenciais do formulário de login estão visíveis."""
    expect(login_page.locator("#login-form")).to_be_visible()
    expect(login_page.locator("#email")).to_be_visible()
    expect(login_page.locator("#password")).to_be_visible()
    expect(login_page.locator("#btn-login")).to_be_visible()
    expect(login_page.locator("#toggle-password")).to_be_visible()
    
    assert login_page.locator("#btn-login").inner_text() == "Entrar"

def test_toggle_visibilidade_senha_login(login_page):
    """Valida se o botão de mostrar/ocultar senha funciona corretamente no login."""
    password_input = login_page.locator("#password")
    toggle_btn = login_page.locator("#toggle-password")
    
    # O tipo inicial deve ser 'password'
    assert password_input.get_attribute("type") == "password"
    
    # Clica para mostrar a senha
    toggle_btn.click()
    assert password_input.get_attribute("type") == "text"
    
    # Clica novamente para ocultar
    toggle_btn.click()
    assert password_input.get_attribute("type") == "password"

def test_login_credenciais_incorretas_com_erro(login_page):
    """Valida a integração com o Supabase ao enviar credenciais incorretas."""
    login_page.fill("#email", "utilizador.inexistente@ahma.app")
    login_page.fill("#password", "SenhaErrada123!")
    
    login_page.click("#btn-login")
    
    # Aguarda a mensagem de erro da API do Supabase
    error_message = login_page.locator("#error-message")
    error_message.wait_for(state="visible")
    
    assert error_message.is_visible()
    assert "E-mail ou senha incorretos" in error_message.inner_text()
    assert error_message.locator("xpath=self::*[contains(@class, 'ahma-erro-ativo')]")
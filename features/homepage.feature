Feature: Homepage content rendering

  Scenario: Display homepage with mocked CMS content
    Given the CMS is returning homepage content
    When the user visits the homepage
    Then the page should include the title "Optimizely FE PoC"
    And the page should include the call to action